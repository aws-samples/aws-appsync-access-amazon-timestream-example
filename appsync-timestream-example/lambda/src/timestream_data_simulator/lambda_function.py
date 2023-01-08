#!/usr/bin/python

import boto3
from botocore.config import Config
import json
import random
import time
import os


DATABASE_NAME = os.getenv('TIMESTREAM_DB_NAME')
TABLE_NAME = os.getenv('TIMESTREAM_TABLE_NAME')


class IngestTimestream:
    def __init__(self, database_name, table_name, write_client):
        self.database_name = database_name
        self.table_name = table_name
        self.write_client = write_client
        

    @staticmethod
    def print_rejected_records_exceptions(err):
        print("RejectedRecords: ", err)
        for rr in err.response["RejectedRecords"]:
            print("Rejected Index " + str(rr["RecordIndex"]) + ": " + rr["Reason"])
            if "ExistingVersion" in rr:
                print("Rejected record existing version: ", rr["ExistingVersion"])
    
    @staticmethod
    def current_milli_time():
        return str(int(round(time.time() * 1000)))
        
    def write_records(self):
        
        current_time = IngestTimestream.current_milli_time()
        
        fuel_in_litres=random.randint(10,80)
        gps_location_latlong='55.3618,-3.4433'
        
        dimensions = [
            {'Name': 'fleet', 'Value': "acme_fleet"},
            {'Name': 'fuel_capacity_in_litres', 'Value': str(80)},
            {'Name': 'load_capacity_in_tons', 'Value': str(20)},
            {'Name': 'make', 'Value': "volvo"},
            {'Name': 'model', 'Value': "v2"},
            {'Name': 'truck_id', 'Value': "truck123"}
        ]

        common_attributes = {
            'Dimensions': dimensions,
            'Time': current_time
        }

        current_fuel_lvl_in_litres = {
            'Name': 'current_fuel_lvl_in_litres',
            'Value': str(fuel_in_litres),
            'Type': 'BIGINT'
        }

        gps_location_latlong = {
            'Name': 'gps_location_latlong',
            'Value': str(gps_location_latlong),
            'Type': 'BIGINT'
        }

        computational_record = {
            'MeasureName': 'computational_record',
            'MeasureValues': [current_fuel_lvl_in_litres,gps_location_latlong],
            'MeasureValueType': 'MULTI'
        }
        
        

        records = [computational_record]

        try:
            result = self.write_client.write_records(DatabaseName=self.database_name, TableName=self.table_name,
                                                     Records=records, CommonAttributes=common_attributes)
            if result and result['ResponseMetadata']:
                print("WriteRecords Status: [%s]" % result['ResponseMetadata']['HTTPStatusCode'])
        except self.write_client.exceptions.RejectedRecordsException as err:
            IngestTimestream.print_rejected_records_exceptions(err)
        except Exception as err:
            print("Error:", err)



def lambda_handler(event, context):

    session = boto3.Session();
    write_client = session.client('timestream-write',
                                  config=Config(region_name='eu-west-1', read_timeout=20, max_pool_connections=5000,retries={'max_attempts': 10}))

    
    ingestTimestream=IngestTimestream(DATABASE_NAME, TABLE_NAME, write_client)
    ingestTimestream.write_records()
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from simulator!')
    }
