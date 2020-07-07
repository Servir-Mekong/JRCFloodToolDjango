# -*- coding: utf-8 -*-

from django.conf import settings

import logging
logger = logging.getLogger(settings.LOGGER_NAME)
import drive
import random
import string
import time


# An authenticated Drive helper object for the app service account.
APP_DRIVE_HELPER = drive.DriveHelper(settings.GOOGLE_OAUTH2_CREDENTIALS)

# -----------------------------------------------------------------------------
def _GetUniqueString():
    """Returns a likely-to-be unique string."""
    random_str = ''.join(
      random.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    date_str = str(int(time.time()))
    return date_str + random_str



def _GiveFilesToUser(temp_file_prefix, email, user_id, filename, oauth2object):
    """Moves the files with the prefix to the user's Drive folder.

    Copies and then deletes the source files from the app's Drive.

    Args:
    temp_file_prefix: The prefix of the temp files in the service
        account's Drive.
    email: The email address of the user to give the files to.
    user_id: The ID of the user to give the files to.
    filename: The name to give the files in the user's Drive.

    Returns:
    A link to the files in the user's Drive.
    """
    print(temp_file_prefix)
    files = APP_DRIVE_HELPER.GetExportedFiles(temp_file_prefix)

    # Grant the user write access to the file(s) in the app service
    # account's Drive.
    for f in files:
        APP_DRIVE_HELPER.GrantAccess(f['id'], email)

    # Create a Drive helper to access the user's Google Drive.
    user_drive_helper = drive.DriveHelper(oauth2object, True)

    # Copy the file(s) into the user's Drive.
    if len(files) == 1:
        file_id = files[0]['id']
        copied_file_id = user_drive_helper.CopyFile(file_id, filename)
        trailer = 'open?id=' + copied_file_id
    else:
        trailer = ''
        for f in files:
          # The titles of the files include the coordinates separated by a dash.
          coords = '-'.join(f['title'].split('-')[-2:])
          user_drive_helper.CopyFile(f['id'], filename + '-' + coords)

    # Delete the file from the service account's Drive.
    for f in files:
        APP_DRIVE_HELPER.DeleteFile(f['id'])

    return 'https://drive.google.com/' + trailer
