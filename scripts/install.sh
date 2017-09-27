#!/bin/bash

# Script to turn a generic Ubuntu box into an Django server hosting the floodtool
# with PostgreSQL, Nginx, Gunicorn, Virtualenv and supervisor

# Update system
sudo apt-get update
sudo apt-get upgrade

