# -*- coding: utf-8 -*-

from django.conf import settings
from django.http import JsonResponse
from core import GEEApi

def api(request):

    get = request.GET.get
    action = get('action', '')

    if action:
        public_methods = ['get-map-id', 'download-url', 'download-to-drive', 'oauth2']
        if action in public_methods:
            start_year = get('start', settings.EE_START_YEAR)
            end_year = get('end', settings.EE_END_YEAR)
            shape = get('shape', '')
            geom = get('geom', '')
            radius = get('radius', '')
            center = get('center', '')
            file_name = get('file', '')
            core = GEEApi(start_year, end_year, shape, geom, radius, center)
            if action == 'get-map-id':
                data = core.get_map_id()
            elif action == 'download-url':
                data = core.get_download_url()
            elif action == 'download-to-drive':
                session_cache = request.session._session_cache
                if 'google_oauth2_credentials' in session_cache:
                    import json
                    from oauth2client.client import OAuth2Credentials
                    google_oauth2_credentials = json.loads(session_cache['google_oauth2_credentials'])
                    access_token = google_oauth2_credentials['access_token']
                    client_id = google_oauth2_credentials['client_id']
                    client_secret = google_oauth2_credentials['client_secret']
                    refresh_token = google_oauth2_credentials['refresh_token']
                    token_expiry = google_oauth2_credentials['token_expiry']
                    token_uri = google_oauth2_credentials['token_uri']
                    user_agent = google_oauth2_credentials['user_agent']
                    revoke_uri = google_oauth2_credentials['revoke_uri']
                    id_token = google_oauth2_credentials['id_token']
                    token_response = google_oauth2_credentials['token_response']
                    scopes = google_oauth2_credentials['scopes']
                    token_info_uri = google_oauth2_credentials['token_info_uri']
                    id_token_jwt = google_oauth2_credentials['id_token_jwt']
                    oauth2object = OAuth2Credentials(access_token, client_id, client_secret, refresh_token, token_expiry, token_uri, user_agent, revoke_uri, id_token, token_response, scopes, token_info_uri, id_token_jwt)
                    user_email = id_token['email']
                    user_id = id_token['sub']
                    data = core.download_to_drive(user_email, user_id, file_name, oauth2object)
                else:
                    # default fallback
                    data = {'error': 'You have not allowed the tool to use your google drive to upload file! Allow it first and try again!'}
            return JsonResponse(data)