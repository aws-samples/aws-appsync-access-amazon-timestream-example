const AWS = require("aws-sdk");
const tsdbClient = new AWS.TimestreamQuery();

const getSensorData = async (durationInMinutes) => {
    try {
        let response;
        const QUERY_1 = `SELECT * FROM "${process.env.TIMESTREAM_DB_NAME}"."${process.env.TIMESTREAM_TABLE_NAME}" where time > ago(${durationInMinutes}m)`;
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

function parseQueryResult(response) {
    var res = "";
    const queryStatus = response.QueryStatus;
    console.log("Current query status: " + JSON.stringify(queryStatus));

    const columnInfo = response.ColumnInfo;
    const rows = response.Rows;

    res = "[";
    var i = 0;
    rows.forEach(function (row) {
        if (i != 0) res += ",";
        i = i + 1;
        res += parseRow(columnInfo, row);
    });
    return res + "]";
}

function parseRow(columnInfo, row) {
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

function parseDatum(info, datum) {
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

function parseTimeSeries(info, datum) {
    const timeSeriesOutput = [];
    datum.TimeSeriesValue.forEach(function (dataPoint) {
        timeSeriesOutput.push(`{time=${dataPoint.Time}, value=${parseDatum(info.Type.TimeSeriesMeasureValueColumnInfo, dataPoint.Value)}}`)
    });

    return `[${timeSeriesOutput.join(", ")}]`
}

function parseScalarType(info, datum) {
    return parseColumnName(info) + "\"" + datum.ScalarValue + "\"";
}

function parseColumnName(info) {
    if (info.Name.split('::')[1] != null) return info.Name == null ? "" : `\"${info.Name.split('::')[0] + '_' + info.Name.split('::')[1]}\":`;
    else return info.Name == null ? "" : `\"${info.Name}\":`;

}

function parseArray(arrayColumnInfo, arrayValues) {
    const arrayOutput = [];
    arrayValues.forEach(function (datum) {
        arrayOutput.push(parseDatum(arrayColumnInfo, datum));
    });
    return `[${arrayOutput.join(", ")}]`
}

exports.handler = async (event) => {
    console.log(event);
    switch (event.info.fieldName) {
        case "getSensorData":
            return await getSensorData(event.arguments.durationInMinutes);
        default:
        return null;
    }
}