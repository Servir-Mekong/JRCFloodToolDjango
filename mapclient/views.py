# -*- coding: utf-8 -*-

from django.http import HttpResponseRedirect
from django.conf import settings
from django.shortcuts import render
from apiclient.discovery import build

from utils import UserInfo, CredentialStorage

from oauth2client.contrib.django_util.decorators import oauth_required

@oauth_required
def index(request):

    return render(request, 'map.html', {})
    #user_email = request.oauth.credentials.id_token['email']
    #user_id = request.oauth.credentials.id_token['sub']
    #return 'biplov'
    #if request.path != '/en/map/[[partner.src]]':
    #    if settings.USER_ID:
    #        credential_storage = CredentialStorage(settings.USER_ID)
    #        credential = credential_storage.get_credential(credential)
    #        if credential:
    #            return render(request, 'map.html', {})
        # default fallback
    #    authorize_url = settings.FLOW.step1_get_authorize_url()
    #    return HttpResponseRedirect(authorize_url)

    #credential = storage.get()
    #if credential:
    #    return render(request, 'map.html', {})
    #else:
    #    authorize_url = FLOW.step1_get_authorize_url()
    #    return HttpResponseRedirect(authorize_url)
