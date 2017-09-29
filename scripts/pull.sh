#!/bin/sh

git reset --hard HEAD
git pull
python /home/jrcfloodtool/manage.py collectstatic
