# -*- coding: utf-8 -*-

from django.conf import settings
import ee
import time
from utils import get_unique_string, transfer_files_to_user_drive
import pandas
import geopandas
from shapely.geometry import shape, Polygon, Point, MultiPolygon
from django.http import JsonResponse
import numpy as np
import pandas as pd
from django.http import HttpResponse
import xlsxwriter
import base64
# -----------------------------------------------------------------------------
class GEEApi():
    """ Google Earth Engine API """

    def __init__(self, start_year, end_year, start_month, end_month, shape, geom, radius, center, method):

        ee.Initialize(settings.EE_CREDENTIALS)
        self.IMAGE_COLLECTION_RAW = ee.ImageCollection(settings.EE_IMAGE_COLLECTION_ID)
        self.MAYANMAR = ee.FeatureCollection(settings.EE_MEKONG_FEATURE_COLLECTION_MAYANMAR)
        self.FEATURE_COLLECTION = ee.FeatureCollection(settings.EE_MEKONG_FEATURE_COLLECTION_ID)
        self.TS_POP = ee.FeatureCollection(settings.EE_MEKONG_FEATURE_COLLECTION_TS_POP)
        self.TS_WH = ee.FeatureCollection(settings.EE_MEKONG_FEATURE_COLLECTION_TS_WH)
        self.State_Reg = ee.FeatureCollection(settings.EE_MEKONG_FEATURE_COLLECTION_SR)
        self.Shelter = ee.FeatureCollection(settings.EE_MEKONG_FEATURE_COLLECTION_SHELTER)
        self.TS = ee.FeatureCollection(settings.EE_MEKONG_FEATURE_COLLECTION_ID1)
        self.POPULATION = ee.FeatureCollection(settings.EE_MEKONG_IMAGE_COLLECTION_POPULATION)
        self.COUNTRIES_GEOM = self.FEATURE_COLLECTION.filter(\
                    ee.Filter.inList('Name', settings.COUNTRIES_NAME)).geometry()


        self.start_year = start_year
        self.end_year = end_year
        self.start_month = start_month
        self.end_month = end_month
        self.geom = geom
        self.radius = radius
        self.center = center
        self.method = method
        self.geometry = self._get_geometry(shape)
        self.IMAGE_COLLECTION = self.IMAGE_COLLECTION_RAW.filterBounds(self.geometry)
        #global water_percent_image
        #water_percent_image = self._calculate_water_percent_image()


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
    # def _get_filtered_image_collection(self):
    #     """
    #         Returns the filtered image collection based on the type of method
    #         selected for the time - continuous and discrete
    #     """

    #     if self.method == 'discrete':
    #         return self.IMAGE_COLLECTION.filterBounds(self.geometry).\
    #                 filter(ee.Filter.calendarRange(int(self.start_year), int(self.end_year), 'year')).\
    #                 filter(ee.Filter.calendarRange(int(self.start_month), int(self.end_month), 'month'))
    #     else:
    #         return self.IMAGE_COLLECTION.filterBounds(self.geometry).\
    #                                     filterDate(self.start_year + '-' + self.start_month,
    #                                                self.end_year + '-' + self.end_month)

    # -------------------------------------------------------------------------
    # def _calculate_water_percent_image(self):

    #     filtered_image_collection = self._get_filtered_image_collection()

    #     observation_image_collection = filtered_image_collection.map(self._get_observations_image)

    #     water_image_collection = filtered_image_collection.map(self._get_water_image)

    #     # Get the sum image of image collection
    #     sum_observation_img = ee.ImageCollection(observation_image_collection).sum().toFloat()
    #     sum_water_img = ee.ImageCollection(water_image_collection).sum().toFloat()

    #     # water percentage image
    #     water_percent_image = sum_water_img.divide(sum_observation_img).multiply(100)

    #     # mask water percentage image
    #     masked_water_percent_image = water_percent_image.gt(1)

    #     # update the original water percentage image
    #     water_percent_image = water_percent_image.updateMask(masked_water_percent_image)

    #     # clip the water percentage image to geometry
    #     return water_percent_image.clip(self.geometry)


    def _get_obsbands_image(self, img):
        """
            Returns the new image setting the attribute from the img
            img is a filtered image
        """

        #  observation is img > 0
        obs = img.gt(0)

        return img.addBands(obs.rename(['obs']).set('system:time_start', img.get('system:time_start')))


    def _get_waterbands_image(self, img):
        """
            Returns the new image setting the attribute from the img
            img is a filtered image
        """

        #  observation is img > 0
        water = img.select('water').eq(2)
        return img.addBands(water.rename(['onlywater']).set('system:time_start', img.get('system:time_start')))

    def _get_filtered_image_collection(self):
        """
            Returns the filtered image collection based on the type of method
            selected for the time - continuous and discrete
        """
        startDate = ee.Date.fromYMD(int(self.start_year), int(self.start_month), 1)
        if (int(self.end_month) >=12):
            endDate = ee.Date.fromYMD(int(self.end_year), int(self.end_month),31)
        else:
            endDate = ee.Date.fromYMD(int(self.end_year), int(self.end_month)+1,1)

        years = endDate.difference(startDate, 'year').toInt().add(1)
        #print('Number of year selected : ', years)

        return self.IMAGE_COLLECTION.filterBounds(self.geometry).filterDate(startDate, endDate)


    def _calculate_water_percent_image(self):

        myjrc = self._get_filtered_image_collection()
        myjrc = myjrc.map(self._get_obsbands_image)
        myjrc = myjrc.map(self._get_waterbands_image)

        # clip the water percentage image to geometry
        totalObs = ee.Image(ee.ImageCollection(myjrc.select("obs")).sum().toFloat())
        totalWater = ee.Image(ee.ImageCollection(myjrc.select("onlywater")).sum().toFloat())

        returnTime = totalWater.divide(totalObs).multiply(100)

        myMask = returnTime.eq(0).Not()
        returnTime = returnTime.updateMask(myMask)
        myMask2 = returnTime.lt(82)
        returnTime = returnTime.updateMask(myMask2).clip(self.geometry)

        return returnTime


    # Function to Convert Feature Classes to Pandas Dataframe
    def fc2df(self, fc):
        # Convert a FeatureCollection into a pandas DataFrame
        # Features is a list of dict with the output
        features = fc.getInfo()['features']

        dictarr = []

        for f in features:
            # Store all attributes in a dict
            attr = f['properties']
            dictarr.append(attr)

        return pandas.DataFrame(dictarr)

    def fc2dfgeo(self, fc):
        # Convert a FeatureCollection into a pandas DataFrame
        # Features is a list of dict with the output
        features = fc.getInfo()['features']

        dictarr = []

        for f in features:
            # Store all attributes in a dict
            attr = f['properties']
            # and treat geometry separately
            attr['geometry'] = f['geometry']  # GeoJSON Feature!
            # attr['geometrytype'] = f['geometry']['type']
            dictarr.append(attr)

        df = geopandas.GeoDataFrame(dictarr)
        # Convert GeoJSON features to shape
        df['geometry'] = map(lambda s: shape(s), df.geometry)
        return df



    def getExposureTables(self):
        population_df = self.fc2df(self.TS_POP)
        warehouse_df = self.fc2df(self.TS_WH)
        #township_df = self.fc2dfgeo(self.TS)
        shelter_df = self.fc2df(self.Shelter)
        #shelter_df = shelter_df.drop(columns=['Latitude','Longitude'])
        shelter_df = shelter_df.groupby(['TS_PCODE'], as_index=False, sort=False)['No_shelter'].sum()
        warehouse_df = warehouse_df.groupby(['TS_PCODE'], as_index=False, sort=False)['no_warehou'].sum()
        pop_wh_df = pandas.merge(population_df, warehouse_df, how='outer', left_on='TS_PCODE', right_on='TS_PCODE')
        pop_wh_sh_df = pandas.merge(shelter_df, pop_wh_df, how='outer', left_on='TS_PCODE', right_on='TS_PCODE')
        #self.township_id = self.getTownShipId()
        # for row in township_df.iterrows():
        #     #centroidseries = poly.centroid
        #     poly = row['geometry']
        #     if poly and poly.contains(Point(float(96.750), float(19.467))):
        #         print(row)
        #region = self.TS.filter(ee.Filter.eq("ID_3", self.township_id))
        water_percent_image = self._calculate_water_percent_image()
        sumfeatures = water_percent_image.reduceRegions(
                collection= self.TS,
                reducer=ee.Reducer.sum(),
                scale=150
            )
        FloodIndex = sumfeatures.map(self.Floodindexcal)
        self.maximum = FloodIndex.reduceColumns(ee.Reducer.max(),['Findex']).get('max')
        Floodreclass2 = FloodIndex.map(self.Floodreclass1)
        flood_haz_df = self.fc2dfgeo(Floodreclass2)
        # hazard_pop_df =pandas.merge( flood_haz_df, population_df,how='outer', left_on='ID_3', right_on='ID_3')
        # print("hazard_pop",hazard_pop_df.count())
        # hazard_pop_wh_df = pandas.merge(hazard_pop_df, warehouse_df, how='outer', left_on='NAME_3_x', right_on='DDM_WH')
        # print("hazard_pop_wh",hazard_pop_wh_df.count())
        # df5 = pandas.merge(hazard_pop_wh_df, shelter_df, how='outer', left_on='NAME_3_x', right_on='Township')
        # print("df5",df5.count())
        # pop_wh_df = pandas.merge(population_df, warehouse_df, how='outer', left_on='ID_3', right_on='ID_3')
        # pop_wh_sh_df = pandas.merge(shelter_df, pop_wh_df, how='outer', left_on='ID_3', right_on='ID_3')
        #print(list(flood_haz_df.columns))
        df5 = pandas.merge(flood_haz_df, pop_wh_sh_df, how='outer', left_on='TS_PCODE', right_on='TS_PCODE')
        df5 = df5.fillna(0)
        df5['hazard'] = np.where(df5['Freclass']==1, 'Low', np.where(df5['Freclass']==2, 'Moderate', np.where(df5['Freclass']==3, 'High', 'None')))
        return df5


    def getExposureData(self,request):
        exposure_df = self.getExposureTables()
        # exposure_df_wo_geo = exposure_df.drop(columns=['geometry'])
        exposure_df_wo_geo = exposure_df[['ST_x','DT_x','TS_x','sum_pop','no_warehou','hazard','No_shelter']]
        json_data = exposure_df_wo_geo.to_json(orient='records')
        return json_data



    def getExposureDownload(self,request):
        exposure_df = self.getExposureTables()
        try:
            from io import BytesIO as IO # for modern python
        except ImportError:
            from StringIO import StringIO as IO # for legacy python

        # this is my output data a list of lists

        # my "Excel" file, which is an in-memory output file (buffer)
        # for the new workbook
        excel_file = IO()

        xlwriter = pd.ExcelWriter(excel_file, engine='xlsxwriter')
        exposure_df_with_geo = exposure_df[['ST_x','DT_x','TS_x','sum_pop','no_warehou','hazard','No_shelter']]
        exposure_df_with_geo.to_excel(xlwriter, 'exposure')

        xlwriter.save()
        xlwriter.close()

        # important step, rewind the buffer or when it is read() you'll get nothing
        # but an error message when you try to open your zero length file in Excel
        excel_file.seek(0)
        # set the mime type so that the browser knows what to do with the file
        response = HttpResponse(excel_file.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

        # set the file name in the Content-Disposition header
        response['Content-Disposition'] = 'attachment; filename=myfile.xlsx'
        return response
        #return json_data

    def getExposureDatum(self, lat, lng):
        self.p1 = Point(float(lng), float(lat))
        exposure_df = self.getExposureTables()
        ts = None
        for index, row in exposure_df.iterrows():
            #centroidseries = poly.centroid
            poly = row['geometry']
            if poly and poly.contains(self.p1):
                ts = row
        return {'state':ts['ST_x'], 'district':ts['DT_x'],'name': ts['TS_x'], 'pop': ts['sum_pop'], 'hazard': ts['hazard'], 'warehouse': ts['no_warehou'], 'shelter':ts['No_shelter']}

    def getTownShipId(self):
        township_df = self.fc2dfgeo(self.TS)
        for index, row in township_df.iterrows():
            poly = row['geometry']
            if poly and poly.contains(self.p1):
                township_id = row['ID_3']
        return township_id


    # -------------------------------------------------------------------------
    def get_map_id(self):
        water_percent_image = self._calculate_water_percent_image()
        # water_percent_image.getRegion(self.TS_POP, 30).getInfo()
        # print("wter",water_percent_image)
        map_id = water_percent_image.getMapId({
            'min': '0',
            'max': '100',
            'bands': 'onlywater',
            'palette': settings.EE_WATER_PALETTE
        })

        return {
            'eeMapURL': str(map_id['tile_fetcher'].url_format)
        }

    def get_township_id(self):
        empty = ee.Image().float()
        outline = empty.paint(self.TS, 1, 1)
        map_id = outline.getMapId({
            'palette': 'black'
        })

        return {
            'eeMapURL': str(map_id['tile_fetcher'].url_format)
        }

    def get_state_id(self):
        empty = ee.Image().float()
        outline = empty.paint(self.State_Reg, 1, 2.5)
        map_id = outline.getMapId({
            'palette': 'black'
        })

        return {
            'eeMapURL': str(map_id['tile_fetcher'].url_format)
        }

    def get_shelter_id(self):
        feature = self.Shelter.style(color="blue",pointSize=5, pointShape="diamond")
        map_id = feature.getMapId()

        return {

            'eeMapURL': str(map_id['tile_fetcher'].url_format)
        }

    def get_wh_id(self):
        feature = self.TS_WH.style(color="black",pointSize=5, pointShape="hexagram")
        map_id = feature.getMapId()

        return {
            'eeMapURL': str(map_id['tile_fetcher'].url_format)
        }


    def bufferFeature(self, ft):
        #ft = ft.buffer(2000, 100)
        return ft.buffer(2000, 100)



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
            'eeMapURL': str(map_id['tile_fetcher'].url_format)
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
    #@staticmethod
    def Populationreclass(self,feature):
        myClass = ee.Number(2);
        myNumber = ee.Number(feature.get('sum_pop'))
        myClass = myClass.subtract(myNumber.lt(9999))
        myClass = myClass.add(myNumber.gt(99999))
        myClass = myClass.add(myNumber.gt(199999))
        myClass = myClass.add(myNumber.gt(299999))

        return feature.set('Popclass', myClass);

    # -------------------------------------------------------------------------
    #@staticmethod
    def _get_world_pop_image(self):
        popclasses = self.POPULATION.map(self.Populationreclass)
        empty = ee.Image().float()
        WORLD_POP = empty.paint(popclasses,'Popclass')
        return WORLD_POP

    # -------------------------------------------------------------------------
    def get_world_pop_id(self):

        # empty = ee.Image().float()
        # outline = empty.paint(self.TS, 1, 1)
        # map_id = outline.getMapId({
        #     'palette': 'black'
        # })
        image = self._get_world_pop_image()
        # image = image.clip(self.geometry)
        print("new image", image)
        map_id = image.getMapId({
            'min': '1',
            'max': '5',
            'bands': 'constant',
            'palette': 'FFF8DC,F9E79F,E67E22,CB4335,641E16',
            #'gamma': '4'
        })

        return {
            'eeMapURL': str(map_id['tile_fetcher'].url_format)
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
                #'region' : self.geometry.bounds().getInfo()['coordinates'],
                'scale': 150
            })
            return {'downloadUrl': url}
        except Exception as e:
            print(e)
            return {'error': e.message}


    def get_download_url_hazard(self):
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
        FloodReclassfills = empty.paint(Floodreclass2, 'Freclass').clip(self.geometry)
        try:
            url = FloodReclassfills.getDownloadURL({
                'name': 'hazard-layer',
                #'region' : self.geometry.bounds().getInfo()['coordinates'],
                'scale': 150
            })
            return {'downloadUrl': url}
        except Exception as e:
            print(e)
            return {'error': e.message}

    # -------------------------------------------------------------------------
    def download_to_drive(self, user_email, user_id, file_name, oauth2object):

        # water_percent_image = self._calculate_water_percent_image()
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
