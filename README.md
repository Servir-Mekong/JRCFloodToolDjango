# The steps are meant to turn a generic Ubuntu box into an Django server hosting the floodtool with PostgreSQL, Nginx, Gunicorn, Virtualenv and supervisor

### Update system
```sh
sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get clean
```

### Install Admin Tools
```sh
sudo apt-get -y install unzip psmisc mlocate telnet lrzsz vim rcconf htop p7zip dos2unix curl
sudo apt-get clean
sudo apt-get -y install gcc
sudo apt-get clean
sudo apt-get -y install build-essential libssl-dev libffi-dev libxml2-dev libxslt1-dev
sudo apt-get clean
sudo apt-get -y install libtiff5-dev libjpeg8-dev zlib1g-dev libfreetype6-dev liblcms2-dev libwebp-dev tcl8.6-dev tk8.6-dev python-tk
sudo apt-get clean
```

### Git
```sh
sudo apt-get -y install git-core
sudo apt-get clean
```


### Install rabbitmq message broker
```sh
sudo apt-get -y install erlang
sudo apt-get -y install rabbitmq-server
```

### Enable the RabbitMQ service
```sh
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server
```

### Check the status of the RabbitMQ server
```sh
sudo systemctl status rabbitmq-server
```

### For local development, you can start the celery as
```sh
celery -A name_of_app worker -l info
```

`NB: This is recommended only for development. For production, we need to use it as service`

### Postgres
```sh
sudo apt-get -y install postgresql postgresql-contrib libpq-dev python-psycopg2
sudo apt-get -y install postgis
sudo apt-get clean
```

### creating the database and user
- switch to superuser postgres
```sh
sudo su - postgres
```
- Create user for the tool
```sh
createuser --interactive -P
# The following questions shall be asked
#Enter name of role to add: jrcfloodtool
#Enter password for new role: 
#Enter it again: 
#Shall the new role be a superuser? (y/n) n
#Shall the new role be allowed to create databases? (y/n) n
#Shall the new role be allowed to create more new roles? (y/n) n
```
- Now create database
```sh
# jrcflood is the name of the database and jrcfloodtool is the owner
createdb --owner jrcfloodtool jrcflood
```
- Logout
```sh
logout
```

### Install Python Virtual Environment
```sh
sudo apt-get -y install python-virtualenv
sudo apt-get clean
```

### Create a folder for the jrcfloodtool
```sh
sudo mkdir /home/jrcfloodtool
```
- grant permission
```sh
sudo chown -R -v your-user /your-folder
```

### Now create a virtual env for the jrcfloodtool
```sh
virtualenv /home/jrcfloodtool/jrcfloodtool_env
```

### Workon the virtual env we just created
```sh
source /home/jrcfloodtool/jrcfloodtool_env/bin/activate
```

### Make folder for the jrcfloodtool itself
```sh
cd /home/jrcfloodtool/
mkdir jrcfloodtool
```

### Install Python and environment
```sh
sudo apt-get -y install python-dev
sudo apt-get clean
sudo apt-get -y install python-pip
sudo apt-get -y install python-pillow
sudo apt-get clean
```

### Download the jrcfloodtool from git
```sh
env GIT_SSL_NO_VERIFY=true git clone https://github.com/Servir-Mekong/JRCFloodToolDjango.git jrcfloodtool
cd jrcfloodtool/
```

### Install dependencies from the requirements.txt
```sh
pip install -r requirements.txt
```

### Copy the settings.example.py in the jrcfloodtool and rename it as settings.py
##### Make changes in the settings
1. Make changes in the database settings
2. ALLOWED_URL
3. Change the TIME_ZONE. The list of all the available timezone is avaialble [here](http://bit.ly/2glGdNY)
4. Make a folder named credentials in the project path and copy client_secret.json and privatekey.json

### Verify the server is running by
```sh
python manage.py runserver 0.0.0.0:8000
# To end Ctrl + C
```

### Now migrate the database
```sh
python manage.py migrate
```

### Install application server
```sh
pip install gunicorn
```

### Check if gunicorn is running well by
```sh
gunicorn jrcfloodtool.wsgi:application --bind 0.0.0.0:8001
```

### Now make sh (or bash) script called outside from project to automate with gunicorn
```sh
cd ..
nano gunicorn_jrcfloodtool.sh
```
##### Edit according to your environment
```sh
#!/bin/bash

NAME="jrcfloodtool"                                   # Name of the application
DJANGODIR=/home/jrcfloodtool/jrcfloodtool             # Django project directory
SOCKFILE=/home/jrcfloodtool/jrcfloodtool_env/run/gunicorn.sock # we will communicte using this unix socket
USER=ubuntu                                           # the user to run as
GROUP=ubuntu                                          # the group to run as
NUM_WORKERS=3                                         # how many worker processes should Gunicorn spawn;                                               # usually is NUM_OF_CPU * 2 + 1
DJANGO_SETTINGS_MODULE=jrcfloodtool.settings          # which settings file should Django use
DJANGO_WSGI_MODULE=jrcfloodtool.wsgi                  # WSGI module name
TIMEOUT=60
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
  --timeout $TIMEOUT \
  --bind=unix:$SOCKFILE \
  --log-level=debug \
  --log-file=-
```

### Now make this script executable
```sh
sudo chmod u+x gunicorn_jrcfloodtool.sh
```

### Now install supervisor
```sh
sudo apt-get -y install supervisor
```

### Now create a supervisor conf file for the project
```sh
sudo nano /etc/supervisor/conf.d/jrcfloodtool.conf
```

##### And add the following bash script
```sh
[program:jrcfloodtool]
command = /home/jrcfloodtool/gunicorn_jrcfloodtool.sh ; Command to start app
user = ubuntu                                         ; User to run as
stdout_logfile = /home/jrcfloodtool/logs/jrcfloodtool_supervisor.log ; Where to write log messages
redirect_stderr = true                                ; Save stderr in the same log
environment=LANG=en_US.UTF-8,LC_ALL=en_US.UTF-8       ; Set UTF-8 as default encoding
```

### Now create the required files and folder
```sh
mkdir -p /home/jrcfloodtool/logs/
touch /home/jrcfloodtool/logs/jrcfloodtool_supervisor.log
```

### Make supervisor reread configuration files

#### First Check the Ubuntu version
```sh
lsb_release -a
```

##### For ubuntu 14.04
```sh
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start jrcfloodtool
```

##### For ubuntu 16.04
```sh
sudo systemctl restart supervisor
sudo systemctl enable supervisor
```

#### Check status of supervisor
```sh
sudo supervisorctl status jrcfloodtool
jrcfloodtool             RUNNING  pid 24768, uptime 0:00:10
```

### Install nginx
```sh
sudo apt-get -y install nginx
```

### Make a conf file for nginx
```sh
sudo nano /etc/nginx/sites-available/jrcfloodtool.conf
```
##### Then add the following script to the conf file
```sh
upstream jrcfloodtool_server {
  # fail_timeout=0 means we always retry an upstream even if it failed
  # to return a good HTTP response (in case the Unicorn master nukes a
  # single worker for timing out).
  server unix:/home/jrcfloodtool/jrcfloodtool_env/run/gunicorn.sock fail_timeout=0;
}

server {

    listen   80;
    server_name <your domain name>;

    client_max_body_size 4G;
    
    keepalive_timeout 0;
    sendfile on;
    
    access_log /home/jrcfloodtool/logs/nginx-access.log;
    error_log /home/jrcfloodtool/logs/nginx-error.log;

    location /static/ {
        alias   /home/jrcfloodtool/jrcfloodtool/static/;
    }

    location /media/ {
        alias   /home/jrcfloodtool/jrcfloodtool/media/;
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
            proxy_pass http://jrcfloodtool_server;
            break;
        }
    }

    # Error pages
    error_page 500 502 503 504 /500.html;
    location = /500.html {
        root /home/jrcfloodtool/jrcfloodtool/static/;
    }
}
```

### Make a soft link to the nginx conf
```sh
sudo ln -s /etc/nginx/sites-available/jrcfloodtool.conf /etc/nginx/sites-enabled/jrcfloodtool.conf
```

### You can delete the default soft link in the sites-enabled as
```sh
sudo rm /etc/nginx/sites-enabled/default
```

### start the nginx service
```sh
sudo service nginx start
```

### Sometimes ngnix might not work, so consider restarting the service as well
```sh
sudo service nginx restart
```

### see the status of the nginx service
```sh
sudo service nginx status
```

`NB: make sure the application, script and services have necessary permission to run`
### You can change permissions as
`sudo chown -R -v your-user /your-folder`
