# -*- coding: utf-8 -*-

from django.conf import settings
import ee
import time
from utils import get_unique_string, transfer_files_to_user_drive


class GEEApi():
    """ Google Earth Engine API """

    def __init__(self, start_year, end_year, shape, geom, radius, center):

        ee.Initialize(settings.EE_CREDENTIALS)
        self.IMAGE_COLLECTION = ee.ImageCollection(settings.EE_IMAGE_COLLECTION_ID)
        self.FEATURE_COLLECTION = ee.FeatureCollection(settings.EE_MEKONG_FEATURE_COLLECTION_ID)
        self.COUNTRIES_GEOM = self.FEATURE_COLLECTION.filter(\
                    ee.Filter.inList('Country', settings.COUNTRIES_NAME)).geometry()
        self.start_year = start_year
        self.end_year = end_year
        self.geom = geom
        self.radius = radius
        self.center = center
        self.geometry = self._get_geometry(shape)

    # -------------------------------------------------------------------------
    def _get_geometry(self, shape):

        if shape:
            if shape == 'rectangle':
                _geom = self.geom.split(',')
                coor_list = [float(_geom_) for _geom_ in self.geom]
                geometry = ee.Geometry.Rectangle(coor_list)
            elif shape == 'circle':
                _geom = self.center.split(',')
                coor_list = [float(_geom_) for _geom_ in self.geom]
                geometry = ee.Geometry.Point(coor_list).buffer(float(radius))
            elif shape == 'polygon':
                _geom = self.geom.split(',')
                coor_list = [float(_geom_) for _geom_ in _geom]
                geometry = ee.Geometry.Polygon(coor_list)
        else:
            geometry = self.COUNTRIES_GEOM

        return geometry

    # ---------------------------------------------------------------------
    def _get_observations_image(self, img):
        """ 
            Returns the new image setting the attribute from the img
            img is a filtered image
        """

        return ee.Image(img.gt(0)).set('system:time_start', img.get('system:time_start'))

    # ---------------------------------------------------------------------
    def _get_water_image(self, img):
        """ 
            Returns the new image setting the attribute from the img
            img is a filtered image
        """

        return ee.Image(img.select('water').eq(2)).set('system:time_start', img.get('system:time_start'))

    # -------------------------------------------------------------------------
    def _calculate_water_percent_image(self):

        filtered_image_collection = self.IMAGE_COLLECTION.filterBounds(self.geometry).\
                                        filterDate(self.start_year, self.end_year)

        observation_image_collection = filtered_image_collection.map(self._get_observations_image)

        water_image_collection = filtered_image_collection.map(self._get_water_image)

        # Get the sum image of image collection
        sum_observation_img = ee.ImageCollection(observation_image_collection).sum().toFloat()
        sum_water_img = ee.ImageCollection(water_image_collection).sum().toFloat()

        # water percentage image
        water_percent_image = sum_water_img.divide(sum_observation_img).multiply(100)

        # mask water percentage image
        masked_water_percent_image = water_percent_image.gt(1)

        # update the original water percentage image
        water_percent_image = water_percent_image.updateMask(masked_water_percent_image)

        # clip the water percentage image to geometry
        return water_percent_image.clip(self.geometry)

    # -------------------------------------------------------------------------
    def get_map_id(self):

        water_percent_image = self._calculate_water_percent_image()
        map_id = water_percent_image.getMapId({
            'min': '0',
            'max': '100',
            'bands': 'water',
            'palette': settings.EE_WATER_PALETTE
        })

        return {
            'eeMapId': str(map_id['mapid']),
            'eeMapToken': str(map_id['token'])
        }

    # -------------------------------------------------------------------------
    def get_download_url(self):

        water_percent_image = self._calculate_water_percent_image()
        url = water_percent_image.getDownloadURL({
            'name': 'water_extract',
            'scale': 30
        })

        return {'downloadUrl': url}

    # -------------------------------------------------------------------------
    def download_to_drive(self, user_email, user_id, file_name, oauth2object):

        water_percent_image = self._calculate_water_percent_image()
        temp_file_name = get_unique_string()

        if not file_name:
            file_name = temp_file_name + ".tif"
        else:
            file_name = file_name + ".tif"

        task = ee.batch.Export.image.toDrive(
            image = water_percent_image,
            description = 'Export from SERVIR Mekong Team',
            fileNamePrefix = temp_file_name,
            scale = 30,
            region = self.geometry.getInfo()['coordinates'],
            skipEmptyTiles = True
        )
        task.start()

        # Wait for the task to complete (taskqueue auto times out after 10 mins).
        i = 1
        while task.active():
            print ("past %d seconds" % (i * settings.EE_TASK_POLL_FREQUENCY))
            i += 1
            time.sleep(settings.EE_TASK_POLL_FREQUENCY)
        
        # Make a copy (or copies) in the user's Drive if the task succeeded
        state = task.status()['state']
        if state == ee.batch.Task.State.COMPLETED:
            try:
                link = transfer_files_to_user_drive(temp_file_name, user_email, user_id, file_name, oauth2object)
                return {'driveLink': link}
            except Exception as e:
                print (str(e))
                return {'error': str(e)}
        else:
            print ('Task failed (id: %s) because %s.' % (task.id, task.status()['error_message']))
            return {'error': 'Task failed (id: %s) because %s.' % (task.id, task.status()['error_message'])}
