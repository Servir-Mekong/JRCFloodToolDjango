#!/bin/sh
cd /home/jrcfloodtool/jrcfloodtool
git reset --hard HEAD
git pull
python manage.py collectstatic
