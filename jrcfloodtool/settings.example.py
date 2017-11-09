# -*- coding: utf-8 -*-

"""
Django settings for jrcfloodtool  project.
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import ee
import oauth2client
import os

gettext = lambda s: s

DATA_DIR = os.path.dirname(os.path.dirname(__file__))

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '34ig_7a5y79t$%=@(*pu6@5804+yz-)=%9oiiu1k)#9dl)_#h_'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

INTERNAL_IPS = (
    '127.0.0.1',
)

# Application definition


ROOT_URLCONF = 'jrcfloodtool.urls'

WSGI_APPLICATION = 'jrcfloodtool.wsgi.application'

# Celery

CELERY_BROKER_URL = 'amqp://localhost'

CELERY_RESULT_BACKEND = 'amqp'

CELERY_ACCEPT_CONTENT = ['pickle']

# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': '<name-of-db>',
        'USER': '<user-name>',
        'PASSWORD': '<password>',
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.8/topics/i18n/

LANGUAGE_CODE = 'en'

TIME_ZONE = ''

USE_I18N = True

USE_L10N = True

USE_TZ = True

SITE_ID = 1

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.8/howto/static-files/

STATIC_URL = '/static/'

MEDIA_URL = '/media/'

MEDIA_ROOT = os.path.join(DATA_DIR, 'media')

STATIC_ROOT = os.path.join(DATA_DIR, 'static')

#STATICFILES_DIRS = (
#    os.path.join(BASE_DIR, 'jrcfloodtool', 'static'),
#)

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates'),],
        'OPTIONS': {
            'context_processors': [
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.i18n',
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.template.context_processors.media',
                'django.template.context_processors.csrf',
                'django.template.context_processors.tz',
                'sekizai.context_processors.sekizai',
                'django.template.context_processors.static',
                'cms.context_processors.cms_settings'
            ],
            'loaders': [
                'django.template.loaders.filesystem.Loader',
                'django.template.loaders.app_directories.Loader',
                'django.template.loaders.eggs.Loader'
            ],
        },
    },
]


MIDDLEWARE_CLASSES = (
    'cms.middleware.utils.ApphookReloadMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'cms.middleware.user.CurrentUserMiddleware',
    'cms.middleware.page.CurrentPageMiddleware',
    'cms.middleware.toolbar.ToolbarMiddleware',
    'cms.middleware.language.LanguageCookieMiddleware',
)

INSTALLED_APPS = (
    'djangocms_admin_style',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.admin',
    'django.contrib.sites',
    'django.contrib.sitemaps',
    'django.contrib.staticfiles',
    'django.contrib.messages',
    'cms',
    'menus',
    'sekizai',
    'treebeard',
    'djangocms_text_ckeditor',
    'filer',
    'easy_thumbnails',
    'djangocms_column',
    'djangocms_link',
    'cmsplugin_filer_file',
    'cmsplugin_filer_folder',
    'cmsplugin_filer_image',
    'cmsplugin_filer_utils',
    'djangocms_style',
    'djangocms_snippet',
    'djangocms_googlemap',
    'djangocms_video',
    'jrcfloodtool',
    'mapclient',
    # Google Oauth
    'django.contrib.sessions.middleware',
    'oauth2client.contrib.django_util'
)

LANGUAGES = (
    ## Customize this
    ('en', gettext('en')),
)

CMS_LANGUAGES = {
    ## Customize this
    'default': {
        'public': True,
        'hide_untranslated': False,
        'redirect_on_fallback': True,
    },
    1: [
        {
            'public': True,
            'code': 'en',
            'hide_untranslated': False,
            'name': gettext('en'),
            'redirect_on_fallback': True,
        },
    ],
}

CMS_TEMPLATES = (
    ## Customize this
    ('footer.html', 'Footer'),
)

CMS_PERMISSION = True

CMS_PLACEHOLDER_CONF = {}

MIGRATION_MODULES = {
    
}

THUMBNAIL_PROCESSORS = (
    'easy_thumbnails.processors.colorspace',
    'easy_thumbnails.processors.autocrop',
    'filer.thumbnail_processors.scale_and_crop_with_subject_location',
    'easy_thumbnails.processors.filters'
)

#
# Google Earth Engine and Google Drive Settings
#
# GEE authentication
# The service account email address authorized by your Google contact.
EE_ACCOUNT = '<your-ee-account>'
# The private key associated with your service account in Privacy Enhanced
# Email format (deprecated version .pem suffix, new version .json suffix).
EE_PRIVATE_KEY_FILE = os.path.join(BASE_DIR, 'credentials/privatekey.json')

# Service account scope for GEE

GOOGLE_EARTH_SCOPES = (
    'https://www.googleapis.com/auth/earthengine',
)

GOOGLE_OAUTH2_SCOPES = ('https://www.googleapis.com/auth/drive',
                        #'https://www.googleapis.com/auth/drive.file',
                        #'https://www.googleapis.com/auth/drive.appdata',
                        'profile',
                        'email',)

EE_CREDENTIALS = ee.ServiceAccountCredentials(EE_ACCOUNT,
                                              EE_PRIVATE_KEY_FILE,
                                              GOOGLE_EARTH_SCOPES)

# Frequency to poll for export EE task completion (seconds)
EE_TASK_POLL_FREQUENCY = 10

GOOGLE_OAUTH2_CLIENT_SECRETS_JSON = os.path.join(BASE_DIR, 'credentials/client_secret.json')

GOOGLE_OAUTH2_CREDENTIALS = oauth2client.service_account.ServiceAccountCredentials.\
                            from_json_keyfile_name(EE_PRIVATE_KEY_FILE,
                                                   ['https://www.googleapis.com/auth/drive',
                                                    #'https://www.googleapis.com/auth/drive.file',
                                                    #'https://www.googleapis.com/auth/drive.appdata'
                                                    ])

# Filter Date
EE_START_YEAR = '2000'
EE_END_YEAR = '2012'

# Filter Image Collection
EE_IMAGE_COLLECTION_ID = 'JRC/GSW1_0/MonthlyHistory'

EE_MEKONG_FEATURE_COLLECTION_ID = 'ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw'

EE_WATER_PALETTE = 'c10000, d742f4, 001556, b7d2f7'

# Other Settings
COUNTRIES_NAME = ['Myanmar (Burma)', 'Thailand', 'Laos', 'Vietnam', 'Cambodia']

