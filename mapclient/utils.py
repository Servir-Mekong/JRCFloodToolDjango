# -*- coding: utf-8 -*-

import drive
import httplib2
import random
import string
import time
import oauth2client

from django.conf import settings

from apiclient.discovery import build
from oauth2client.contrib.django_util import decorators

from oauth2client.contrib.multiprocess_file_storage import MultiprocessFileStorage

class UserInfo:
    # -------------------------------------------------------------------------
    def __init__(self, credential):
        self.credential = credential
        _http_auth = self.credential.authorize(httplib2.Http())
        _build_user_profile = build('oauth2', 'v2', _http_auth)
        self.user_profile = _build_user_profile.userinfo().get().execute()

    # -------------------------------------------------------------------------
    def get_user_id(self):
        """ Returns the user id from the build user profile """
        self.user_id = self.user_profile['id']
        return self.user_id

    # -------------------------------------------------------------------------
    def get_user_email(self):
        """ Returns the user email from the build user profile """
        self.user_email = self.user_profile['email']
        return self.user_email

    # -------------------------------------------------------------------------
    def get_credential(self):
        """ Returns the property credential """
        return self.credential

# -----------------------------------------------------------------------------
class CredentialStorage:
    # -------------------------------------------------------------------------
    def __init__(self, user_id):
        self.filename = 'credentials/user_credentials'
        self.key = user_id
        #key = '{}-{}'.format(client_id, user_id)
        self.storage = MultiprocessFileStorage(self.filename, self.key)

    # -------------------------------------------------------------------------
    def set_credential(self, credential):
        self.storage.put(credential)
        credential.set_store(self.storage)

    # -------------------------------------------------------------------------
    def get_credential(self):
        return self.storage.get()

# -----------------------------------------------------------------------------
def get_unique_string():
    """Returns a likely-to-be unique string."""

    random_str = ''.join(
        random.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    date_str = str(int(time.time()))
    return date_str + random_str

# -----------------------------------------------------------------------------
def transfer_files_to_user_drive(temp_file_name, user_email, user_id, file_name, oauth2object):

    APP_DRIVE_HELPER = drive.DriveHelper(settings.GOOGLE_OAUTH2_CREDENTIALS)
    files = APP_DRIVE_HELPER.GetExportedFiles(temp_file_name)
    # Grant the user write access to the file(s) in the app service account's Drive.
    for f in files:
        APP_DRIVE_HELPER.GrantAccess(f['id'], user_email)

    # Create a Drive helper to access the user's Google Drive.
    #user_credentials = oauth2client.appengine.StorageByKeyName(
    #    oauth2client.appengine.CredentialsModel,
    #    user_id, 'credentials').get()
    user_drive_helper = drive.DriveHelper(oauth2object)

    # Copy the file(s) into the user's Drive.
    if len(files) == 1:
        file_id = files[0]['id']
        copied_file_id = user_drive_helper.CopyFile(file_id, file_name)
        trailer = 'open?id=' + copied_file_id
    else:
        trailer = ''
        for f in files:
            # The titles of the files include the coordinates separated by a dash.
            coords = '-'.join(f['title'].split('-')[-2:])
            user_drive_helper.CopyFile(f['id'], file_name + '-' + coords)

    # Delete the file from the service account's Drive.
    for f in files:
        APP_DRIVE_HELPER.DeleteFile(f['id'])

    return 'https://drive.google.com/' + trailer