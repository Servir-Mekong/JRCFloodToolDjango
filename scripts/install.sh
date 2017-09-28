#!/bin/bash

# Script to turn a generic Ubuntu box into an Django server hosting the floodtool
# with PostgreSQL, Nginx, Gunicorn, Virtualenv and supervisor

# Update system
apt-get update
apt-get -y upgrade
apt-get clean

# Install Admin Tools
apt-get -y install unzip psmisc mlocate telnet lrzsz vim rcconf htop sudo p7zip dos2unix curl
apt-get clean
apt-get -y install gcc
apt-get clean
apt-get -y install build-essential libssl-dev libffi-dev libxml2-dev libxslt1-dev
apt-get clean
apt-get -y install libtiff5-dev libjpeg8-dev zlib1g-dev libfreetype6-dev liblcms2-dev libwebp-dev tcl8.6-dev tk8.6-dev python-tk
apt-get clean

# Git
apt-get -y install git-core
apt-get clean

# Install Python
#apt-get -y install python2.7
apt-get -y install python-dev
apt-get clean

apt-get -y install python-pip
apt-get -y install python-virtualenv
apt-get -y install python-pillow
apt-get clean

# Postgres
apt-get -y install postgresql postgresql-contrib libpq-dev python-psycopg2
apt-get -y install postgis
apt-get clean

# Switch to postgres user
sudo su - postgres

# Create user for the tool
createuser --interactive -P
# The following questions shall be asked
#Enter name of role to add: jrcfloodtool
#Enter password for new role: 
#Enter it again: 
#Shall the new role be a superuser? (y/n) n
#Shall the new role be allowed to create databases? (y/n) n
#Shall the new role be allowed to create more new roles? (y/n) n

# Now create database
# jrcflood is the name of the database and jrcfloodtool is the owner
createdb --owner jrcfloodtool jrcflood

# Logout
logout

# Now create a virtual env for the jrcfloodtool
virtualenv jrcfloodtool_env

# Workon the virtual env we just created
source jrcfloodtool_env/bin/activate

# Make folder for the jrcfloodtool
cd /home
mkdir jrcfloodtool

# Download the jrcfloodtool from git
env GIT_SSL_NO_VERIFY=true git clone https://github.com/Servir-Mekong/JRCFloodToolDjango.git jrcfloodtool
cd jrcfloodtool/

# Install dependencies from the requirements.txt
pip install -r requirements.txt

# Copy the settings.example.py in the jrcfloodtool and rename it as settings.py
# Make changes in the settings
# 1. Make changes in the database settings
# 2. ALLOWED_URL
# 3. Make a folder named credentials in the project path and copy client_secret.json and privatekey.json

# Verify the server is running by
python manage.py runserver 0.0.0.0:8000
# To end Ctrl + C

# Now migrate the database
python manage.py migrate

# Install application server
pip install gunicorn

# Check if gunicorn is running well by
gunicorn jrcfloodtool.wsgi:application --bind 0.0.0.0:8001

# Now make bash script called outside from project to automate with gunicorn
cd ..
nano gunicorn_jrcfloodtool.bash

# Edit according to your environment
# Start
#!/bin/bash

NAME="jrcfloodtool"                                   # Name of the application
DJANGODIR=/home/jrcfloodtool                          # Django project directory
VIRENV=/home/jrcfloodtool_env                         # Env path for the application
SOCKFILE=/home/jrcfloodtool_env/run/gunicorn.sock     # we will communicte using this unix socket
USER=ubuntu                                           # the user to run as
GROUP=ubuntu                                          # the group to run as
NUM_WORKERS=3                                         # how many worker processes should Gunicorn spawn
DJANGO_SETTINGS_MODULE=jrcfloodtool.settings          # which settings file should Django use
DJANGO_WSGI_MODULE=jrcfloodtool.wsgi                  # WSGI module name
echo "Starting $NAME as `whoami`"

# Activate the virtual environment

cd $DJANGODIR
source /home/jrcfloodtool_env/bin/activate
export DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE
export PYTHONPATH=$DJANGODIR:$PYTHONPATH

# Create the run directory if it doesn't exist

RUNDIR=$(dirname $SOCKFILE)
test -d $RUNDIR || mkdir -p $RUNDIR

# Start your Django Unicorn
# Programs meant to be run under supervisor should not daemonize themselves (do not use --daemon)

exec gunicorn ${DJANGO_WSGI_MODULE}:application \
  --name $NAME \
  --workers $NUM_WORKERS \
  --user=$USER --group=$GROUP \
  --bind=unix:$SOCKFILE \
  --log-level=debug \
  --log-file=-

# End

# Now make this script executable.
sudo chmod u+x gunicorn_jrcfloodtool.bash

# Now install supervisor
sudo apt-get -y install supervisor

# Now create a supervisor conf file for the project
sudo nano /etc/supervisor/conf.d/jrcfloodtool.conf

# And add the following bash script
[program:jrcfloodtool]
command = /home/gunicorn_jrcfloodtool.bash                  ; Command to start app
user = ubuntu                                                ; User to run as
stdout_logfile = /home/logs/gunicorn_jrcfloodtool_supervisor.log   ; Where to write log messages
redirect_stderr = true                                       ; Save stderr in the same log
environment=LANG=en_US.UTF-8,LC_ALL=en_US.UTF-8              ; Set UTF-8 as default encoding


# Now create the required files and folder
mkdir -p /home/logs/
touch /home/logs/gunicorn_jrcfloodtool_supervisor.log

# Make supervisor reread configuration files
# For ubuntu 14.04
sudo supervisorctl reread
sudo supervisorctl update

sudo supervisorctl start jrcfloodtool

# For ubuntu 16.04
sudo systemctl restart supervisor
sudo systemctl enable supervisor

# Install nginx
sudo apt-get -y install nginx

# Make a conf file for nginx
sudo nano /etc/nginx/sites-available/jrcfloodtool.conf

# Then add the following script to the conf file
upstream sample_project_server {
  # fail_timeout=0 means we always retry an upstream even if it failed
  # to return a good HTTP response (in case the Unicorn master nukes a
  # single worker for timing out).
  server unix:/home/ubuntu/django_env/run/gunicorn.sock fail_timeout=0;
}

server {

    listen   80;
    server_name <your domain name>;

    client_max_body_size 4G;
    access_log /home/ubuntu/logs/nginx-access.log;
    error_log /home/ubuntu/logs/nginx-error.log;

    location /static/ {
        alias   /home/ubuntu/static/;
    }

    location /media/ {
        alias   /home/ubuntu/media/;
    }

    location / {

        # an HTTP header important enough to have its own Wikipedia entry:
        #   http://en.wikipedia.org/wiki/X-Forwarded-For
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;


        # enable this if and only if you use HTTPS, this helps Rack
        # set the proper protocol for doing redirects:
        # proxy_set_header X-Forwarded-Proto https;

        # pass the Host: header from the client right along so redirects
        # can be set properly within the Rack application
        proxy_set_header Host $http_host;

        # we don't want nginx trying to do something clever with
        # redirects, we set the Host: header above already.
        proxy_redirect off;

        # set "proxy_buffering off" *only* for Rainbows! when doing
        # Comet/long-poll stuff.  It's also safe to set if you're
        # using only serving fast clients with Unicorn + nginx.
        # Otherwise you _want_ nginx to buffer responses to slow
        # clients, really.
        # proxy_buffering off;

        # Try to serve static files from nginx, no point in making an
        # *application* server like Unicorn/Rainbows! serve static files.
        if (!-f $request_filename) {
            proxy_pass http://sample_project_server;
            break;
        }
    }

    # Error pages
    error_page 500 502 503 504 /500.html;
    location = /500.html {
        root /home/ubuntu/static/;
    }
}










