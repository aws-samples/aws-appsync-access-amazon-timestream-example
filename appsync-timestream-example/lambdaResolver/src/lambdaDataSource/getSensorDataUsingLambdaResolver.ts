
const AWS = require("aws-sdk");
const tsdbClient = new AWS.TimestreamQuery();

const getSensorDataUsingLambdaResolver = async (durationInMinutes: number) => {
    try {
        let response;
        const QUERY_1 = `SELECT * FROM ${process.env.TIMESTREAM_DB_NAME}.${process.env.TIMESTREAM_TABLE_NAME} where time > ago(${durationInMinutes}m)`;
        console.log(QUERY_1)
        var nextToken = undefined;
        const params = {
            QueryString: QUERY_1,
            NextToken: nextToken,
        }
        response = await tsdbClient.query(params).promise();
        let result = JSON.parse(parseQueryResult(response))
        console.log('query output', result)

        return result

    } catch (err) {
        console.log(err);
        throw err;
    }
}

function parseQueryResult(response: any) {
    var res = "";
    const queryStatus = response.QueryStatus;
    console.log("Current query status: " + JSON.stringify(queryStatus));

    const columnInfo = response.ColumnInfo;
    const rows = response.Rows;

    res = "[";
    var i = 0;
    rows.forEach(function (row: any) {
        if (i != 0) res += ",";
        i = i + 1;
        res += parseRow(columnInfo, row);
    });
    return res + "]";
}

function parseRow(columnInfo: any, row: any): any {
    const data = row.Data;
    const rowOutput = [];

    var i;
    for (i = 0; i < data.length; i++) {
        let info = columnInfo[i];
        let datum = data[i];
        rowOutput.push(parseDatum(info, datum));
    }

    return `{${rowOutput.join(", ")}}`
}

function parseDatum(info: any, datum: any) {
    if (datum.NullValue != null && datum.NullValue === true) {
        return `\"${info.Name.split(':')[0]}\":\"\"`;
    }

    const columnType = info.Type;

    // If the column is of TimeSeries Type
    if (columnType.TimeSeriesMeasureValueColumnInfo != null) {
        return parseTimeSeries(info, datum);
    }
    // If the column is of Array Type
    else if (columnType.ArrayColumnInfo != null) {
        const arrayValues = datum.ArrayValue;
        return `\"${info.Name.split(':')[0]}\":${parseArray(info.Type.ArrayColumnInfo, arrayValues)}`;
    }
    // If the column is of Row Type
    else if (columnType.RowColumnInfo != null) {
        const rowColumnInfo = info.Type.RowColumnInfo;
        const rowValues = datum.RowValue;
        return parseRow(rowColumnInfo, rowValues);
    }
    // If the column is of Scalar Type
    else {
        return parseScalarType(info, datum);
    }
}

function parseTimeSeries(info: any, datum: any) {
    const timeSeriesOutput: any = [];
    datum.TimeSeriesValue.forEach(function (dataPoint: any) {
        timeSeriesOutput.push(`{time=${dataPoint.Time}, value=${parseDatum(info.Type.TimeSeriesMeasureValueColumnInfo, dataPoint.Value)}}`)
    });

    return `[${timeSeriesOutput.join(", ")}]`
}

function parseScalarType(info: any, datum: any) {
    return parseColumnName(info) + "\"" + datum.ScalarValue + "\"";
}

function parseColumnName(info: any) {
    if (info.Name.split('::')[1] != null) return info.Name == null ? "" : `\"${info.Name.split('::')[0] + '_' + info.Name.split('::')[1]}\":`;
    else return info.Name == null ? "" : `\"${info.Name}\":`;

}

function parseArray(arrayColumnInfo: any, arrayValues: any) {
    const arrayOutput: any = [];
    arrayValues.forEach(function (datum: any) {
        arrayOutput.push(parseDatum(arrayColumnInfo, datum));
    });
    return `[${arrayOutput.join(", ")}]`
}


export default getSensorDataUsingLambdaResolver;