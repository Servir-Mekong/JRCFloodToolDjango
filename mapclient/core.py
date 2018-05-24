# -*- coding: utf-8 -*-

from django.conf import settings
import ee
import time
from utils import get_unique_string, transfer_files_to_user_drive

# -----------------------------------------------------------------------------
class GEEApi():
    """ Google Earth Engine API """

    def __init__(self, start_year, end_year, start_month, end_month, shape, geom, radius, center, method):

        ee.Initialize(settings.EE_CREDENTIALS)
        self.IMAGE_COLLECTION = ee.ImageCollection(settings.EE_IMAGE_COLLECTION_ID)
        self.FEATURE_COLLECTION = ee.FeatureCollection(settings.EE_MEKONG_FEATURE_COLLECTION_ID)
        self.TS = ee.FeatureCollection(settings.EE_MEKONG_FEATURE_COLLECTION_ID1)
        self.COUNTRIES_GEOM = self.FEATURE_COLLECTION.filter(\
                    ee.Filter.inList('Country', settings.COUNTRIES_NAME)).geometry()
        self.start_year = start_year
        self.end_year = end_year
        self.start_month = start_month
        self.end_month = end_month
        self.geom = geom
        self.radius = radius
        self.center = center
        self.method = method
        self.geometry = self._get_geometry(shape)

    # -------------------------------------------------------------------------
    def _get_geometry(self, shape):

        if shape:
            if shape == 'rectangle':
                _geom = self.geom.split(',')
                coor_list = [float(_geom_) for _geom_ in _geom]
                geometry = ee.Geometry.Rectangle(coor_list)
            elif shape == 'circle':
                _geom = self.center.split(',')
                coor_list = [float(_geom_) for _geom_ in _geom]
                geometry = ee.Geometry.Point(coor_list).buffer(float(self.radius))
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

    # -------------------------------------------------------------------------
    def _get_water_image(self, img):
        """ 
            Returns the new image setting the attribute from the img
            img is a filtered image
        """

        return ee.Image(img.select('water').eq(2)).set('system:time_start', img.get('system:time_start'))

    # -------------------------------------------------------------------------
    def _get_filtered_image_collection(self):
        """ 
            Returns the filtered image collection based on the type of method
            selected for the time - continuous and discrete
        """

        if self.method == 'discrete':
            return self.IMAGE_COLLECTION.filterBounds(self.geometry).\
                    filter(ee.Filter.calendarRange(int(self.start_year), int(self.end_year), 'year')).\
                    filter(ee.Filter.calendarRange(int(self.start_month), int(self.end_month), 'month'))
        else:
            return self.IMAGE_COLLECTION.filterBounds(self.geometry).\
                                        filterDate(self.start_year + '-' + self.start_month,
                                                   self.end_year + '-' + self.end_month)

    # -------------------------------------------------------------------------
    def _calculate_water_percent_image(self):

        filtered_image_collection = self._get_filtered_image_collection()

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

    def get_township_id(self):
        empty = ee.Image().float()
        outline = empty.paint(self.TS, 1, 1.5)
        map_id = outline.getMapId({
            'palette': 'black'
        })

        return {
            'eeMapId': str(map_id['mapid']),
            'eeMapToken': str(map_id['token'])
        }

    def get_hazard_map_id(self):

        water_percent_image = self._calculate_water_percent_image()
        empty = ee.Image().float()
        sumfeatures = water_percent_image.reduceRegions(
                reducer=ee.Reducer.sum(),
                collection=self.TS,
                scale=150
            )
        FloodIndex = sumfeatures.map(self.Floodindexcal)
        self.maximum = FloodIndex.reduceColumns(ee.Reducer.max(),['Findex']).get('max')
        Floodreclass2 = FloodIndex.map(self.Floodreclass1)
        fills_image = empty.paint(FloodIndex,'Findex')
        floodIndexfills = empty.paint(Floodreclass2,'Findex2')
        FloodReclassfills = empty.paint(Floodreclass2, 'Freclass')
        outline = empty.paint(self.TS, 1, 1.5)
        # print "outline==",outline.__dict__
        # map_id = outline.getMapId({
        #     'palette': 'black'
        # })
        map_id = FloodReclassfills.getMapId({
            'min': '1',
            'max': '3',
            'palette': '045b06, fafb27, d20504'
        })
        return {
            'eeMapId': str(map_id['mapid']),
            'eeMapToken': str(map_id['token'])
        }

    def Floodindexcal(self,feature):
        findex = ee.Number(feature.get('sum')).\
                        divide(feature.geometry().area().divide(1000000))
        return feature.set('Findex', findex)

    def Floodreclass1(self,feature):
        myClass = ee.Number(2)
        myNumber = ee.Number(feature.get('Findex')).\
                        divide(self.maximum).multiply(100)
        myClass = myClass.subtract(myNumber.lt(5.0))
        myClass = myClass.add(myNumber.gt(10.0))
        return feature.set('Findex2', myNumber).set('Freclass', myClass)


    # -------------------------------------------------------------------------
    @staticmethod
    def _get_world_pop_image():

        WORLD_POP = ee.ImageCollection(settings.EE_WORLD_POP_ID)
        filtered = WORLD_POP.filter(\
                        ee.Filter.inList('country', settings.COUNTRIES_NAME_WORLD_POP))
        filtered = filtered.filterMetadata('year', 'equals', 2015)
        filtered = filtered.filterMetadata('UNadj', 'equals', 'yes')

        return filtered.mosaic()

    # -------------------------------------------------------------------------
    def get_world_pop_id(self):

        image = GEEApi._get_world_pop_image()
        image = image.updateMask(image).clip(self.geometry)
        map_id = image.getMapId({
            'min': '0',
            'max': '100',
            'bands': 'population',
            #'palette': 'fcbda4, fb7050, d32020, 67000d',
            'gamma': '4'
        })

        return {
            'eeMapId': str(map_id['mapid']),
            'eeMapToken': str(map_id['token'])
        }

    # -------------------------------------------------------------------------
    def get_world_pop_number(self):

        image = GEEApi._get_world_pop_image()
        region = image.reduceRegion(ee.Reducer.mean(), self.geometry, 100)
        number = ee.Number(region.get('population')).\
                    multiply(self.geometry.area()).divide(100*100)

        return {
            'populationNumber': int(number.getInfo())
        }

    # -------------------------------------------------------------------------
    def get_download_url(self):

        water_percent_image = self._calculate_water_percent_image()
        try:
            url = water_percent_image.getDownloadURL({
                'name': 'water_extract',
                'scale': 30
            })
            return {'downloadUrl': url}
        except Exception as e:
            return {'error': e.message}

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
