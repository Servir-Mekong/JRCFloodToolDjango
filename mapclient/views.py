# -*- coding: utf-8 -*-

from django.shortcuts import render

from oauth2client.contrib.django_util.decorators import oauth_required

@oauth_required
def index(request):

    return render(request, 'map.html', {})
