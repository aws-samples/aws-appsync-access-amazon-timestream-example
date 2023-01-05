const AWS = require("aws-sdk");
const c = require('constants')
const tsdbClient = new AWS.TimestreamQuery();

//const QUERY_1 = "SELECT * FROM " + c.DATABASE_NAME + "." + c.TABLE_NAME " where time > ago(" + durationInMinutes + "m;

const getSensorData = async (databaseName: string, tableName: string) => {
    try {

        return null

    } catch (err) {
        console.log('TimeStream DB error: ', err)
        return null
    }

}


//let response;
// Load the SDK

// const DB = "SensorDataDB";
// const TABLE = "IoT";

// https://github.com/awslabs/amazon-timestream-tools/blob/mainline/sample_apps/js/query-example.js


// exports.handler = async (context,event,callback) => {
//     const durationInMinutes=context.durationInMinutes;

//     try {
//         const query = "SELECT * FROM "+DB+"."+TABLE+" where time >ago("+durationInMinutes+"m)" ;
//         var nextToken = undefined;
//         queryClient = new AWS.TimestreamQuery();

//         try {
//             response = await tsdbClient.query(params = {
//                     QueryString: query,
//                 NextToken: nextToken,
//             }).promise();


//         } catch (err) {
//             console.error("Error while querying:", err);
//             throw err;
//         }

//     } catch (err) {
//         console.log(err);
//         response= err;
//     }

//     callback(null, JSON.parse(parseQueryResult(response)));
// };


// function parseQueryResult(response) {
//     var res="";
//     const queryStatus = response.QueryStatus;
//     console.log("Current query status: " + JSON.stringify(queryStatus));

//     const columnInfo = response.ColumnInfo;
//     const rows = response.Rows;

//     res="[";
//     var i=0;
//     rows.forEach(function (row) {
//         if(i!=0) res+=","; 
//         i=i+1;
//         res+=parseRow(columnInfo, row);
//     });
//     return res+"]";
// }

// function parseRow(columnInfo, row) {
//     const data = row.Data;
//     const rowOutput = [];

//     var i;
//     for ( i = 0; i < data.length; i++ ) {
//         info = columnInfo[i];
//         datum = data[i];
//         rowOutput.push(parseDatum(info, datum));
//     }

//     return `{${rowOutput.join(", ")}}`
// }

// function parseDatum(info, datum) {
//     if (datum.NullValue != null && datum.NullValue === true) {
//         return `\"${info.Name.split(':')[0]}\":\"\"`;
//     }

//     const columnType = info.Type;

//     // If the column is of TimeSeries Type
//     if (columnType.TimeSeriesMeasureValueColumnInfo != null) {
//         return parseTimeSeries(info, datum);
//     }
//     // If the column is of Array Type
//     else if (columnType.ArrayColumnInfo != null) {
//         const arrayValues = datum.ArrayValue;
//         return `\"${info.Name.split(':')[0]}\":${parseArray(info.Type.ArrayColumnInfo, arrayValues)}`;
//     }
//     // If the column is of Row Type
//     else if (columnType.RowColumnInfo != null) {
//         const rowColumnInfo = info.Type.RowColumnInfo;
//         const rowValues = datum.RowValue;
//         return parseRow(rowColumnInfo, rowValues);
//     }
//     // If the column is of Scalar Type
//     else {
//         return parseScalarType(info, datum);
//     }
// }

// function parseTimeSeries(info, datum) {
//     const timeSeriesOutput = [];
//     datum.TimeSeriesValue.forEach(function (dataPoint) {
//         timeSeriesOutput.push(`{time=${dataPoint.Time}, value=${parseDatum(info.Type.TimeSeriesMeasureValueColumnInfo, dataPoint.Value)}}`)
//     });

//     return `[${timeSeriesOutput.join(", ")}]`
// }

// function parseScalarType(info, datum) {
//         return parseColumnName(info) + "\""+datum.ScalarValue+"\"";
// }

// function parseColumnName(info) {
//     if(info.Name.split('::')[1]!=null)     return info.Name == null ? "" : `\"${info.Name.split('::')[0]+'_'+info.Name.split('::')[1]}\":`; 
//     else     return info.Name == null ? "" : `\"${info.Name}\":`; 

// }

// function parseArray(arrayColumnInfo, arrayValues) {
//     const arrayOutput = [];
//     arrayValues.forEach(function (datum) {
//         arrayOutput.push(parseDatum(arrayColumnInfo, datum));
//     });
//     return `[${arrayOutput.join(", ")}]`
// }


export default getSensorData;