# -*- coding: utf-8 -*-

from celery.result import AsyncResult
from core import GEEApi
from django.conf import settings
from django.http import JsonResponse
from tasks import export_to_drive_task
from datetime import datetime
import time

def api(request):
    
    get = request.GET.get
    action = get('action', '')

    if action:
        public_methods = ['get-map-id', 'get-hazard-id', 'download-url', 'download-to-drive',
                          'get-world-pop-id', 'get-world-pop-number'
                          ]

        if action in public_methods:
            start_year = get('startYear', '2000')
            end_year = get('endYear', '2012')
            start_month = get('startMonth', '01')
            end_month = get('endMonth', '12')
            shape = get('shape', '')
            geom = get('geom', '')
            radius = get('radius', '')
            center = get('center', '')
            file_name = get('file', '')
            method = get('method', '')
            core = GEEApi(start_year, end_year, start_month, end_month, shape, geom, radius, center, method)
            if action == 'get-world-pop-id':
                data = core.get_world_pop_id()
            elif action == 'get-map-id':
                data = core.get_map_id()
            elif action == 'get-hazard-id':
                data = core.get_hazard_map_id()
            elif action == 'download-url':
                data = core.get_download_url()
            elif action == 'get-world-pop-number':
                data = core.get_world_pop_number()
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
                    token_expiry = datetime.strptime(google_oauth2_credentials['token_expiry'], '%Y-%m-%dT%H:%M:%SZ')
                    token_uri = google_oauth2_credentials['token_uri']
                    user_agent = google_oauth2_credentials['user_agent']
                    revoke_uri = google_oauth2_credentials['revoke_uri']
                    id_token = google_oauth2_credentials['id_token']
                    token_response = google_oauth2_credentials['token_response']
                    scopes = set(google_oauth2_credentials['scopes'])
                    token_info_uri = google_oauth2_credentials['token_info_uri']
                    id_token_jwt = google_oauth2_credentials['id_token_jwt']
                    oauth2object = OAuth2Credentials(access_token, client_id, client_secret, refresh_token, token_expiry, token_uri, user_agent, revoke_uri, id_token, token_response, scopes, token_info_uri, id_token_jwt)
                    user_email = id_token['email']
                    user_id = id_token['sub']
                    # for expiry of tokens see this
                    # https://github.com/google/oauth2client/issues/391
                    if settings.EE_USE_CELERY:
                        export_to_drive_task.delay(start_year=start_year,
                                                   end_year=end_year,
                                                   start_month=start_month,
                                                   end_month=end_month,
                                                   shape=shape,
                                                   geom=geom,
                                                   radius=radius,
                                                   center=center,
                                                   method=method,
                                                   access_token=access_token,
                                                   client_id=client_id,
                                                   client_secret=client_secret,
                                                   refresh_token=refresh_token,
                                                   token_expiry=token_expiry,
                                                   token_uri=token_uri,
                                                   user_agent=user_agent,
                                                   revoke_uri=revoke_uri,
                                                   id_token=id_token,
                                                   token_response=token_response,
                                                   scopes=scopes,
                                                   token_info_uri=token_info_uri,
                                                   id_token_jwt=id_token_jwt,
                                                   user_email=user_email,
                                                   user_id=user_id,
                                                   file_name=file_name
                                                   )
                        data = {'info': 'I have started the export! You can check your drive after 5-10 mins to get the exported image!'}
                    else:
                        data = core.download_to_drive(user_email, user_id, file_name, oauth2object)
                    #task = export_to_drive_task.delay
                    #work = AsyncResult(task.task_id)
                    #while not work.ready():
                    #    time.sleep(5)
                    #else:
                    #    try:
                    #        data = work.get()
                    #    except:
                    #        data = {'error': 'Something went wrong. Please try again later!'}
                else:
                    # default fallback
                    data = {'error': 'You have not allowed the tool to use your google drive to upload file! Allow it first and try again!'}
            return JsonResponse(data)