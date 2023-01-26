<h1 align="center">
Access data in Amazon Timestream with AWS AppSync
<br>
   <a href="https://github.com/aws-samples/aws-appsync-access-amazon-timestream-example/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/aws-samples/aws-appsync-access-amazon-timestream-example?display_name=tag"></a>
   <a href="https://github.com/aws-samples/aws-appsync-access-amazon-timestream-example//actions"><img alt="GitHub Workflow Status" src="https://github.com/aws-samples/aws-appsync-access-amazon-timestream-example/workflows/Unit%20Tests/badge.svg"></a>
</h1>

This blog post looks at how to build [GraphQL API](https://graphql.org/) using [AWS AppSync](https://docs.aws.amazon.com/appsync/latest/devguide/what-is-appsync.html) to access [Amazon Timestream](https://aws.amazon.com/timestream/)

### Architecture

Target architecture:

<p align="center">
  <img src="docs/Appsync-timestream.png" alt="AWS Architecture Diagram" />
</p>

### Usage

#### Prerequisites
To deploy the solution,

1. [An AWS Account](https://signin.aws.amazon.com/signin?redirect_uri=https%3A%2F%2Fportal.aws.amazon.com%2Fbilling%2Fsignup%2Fresume&client_id=signup)
2. [The AWS Command Line Interface (AWS CLI)](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

#### Deploy the example

> **Note**
You are responsible for the cost of the AWS services used while running this sample deployment. There is no additional
cost for using this sample. For full details, see the pricing pages for each AWS service that you use in this sample. Prices are subject to change.

> **Note**
Due to this solution using Timestream, please ensure you choose a region to deploy this solution where Timestream is available.


1. Clone the repository to your local machine.
    * `git clone https://github.com/aws-samples/aws-appsync-access-amazon-timestream-example`

2. Create the deployment package.
    * `aws cloudformation package --template-file appsync-timestream-example/template.yaml --s3-bucket <YOUR_BUCKET_NAME_HERE> --output-template-file appsync-timestream-example/packaged-template.yaml`

    > **Note**
    Change <YOUR_BUCKET_NAME_HERE> above to be the name of an S3 bucket in the same region that you deploying this solution into.

3. Deploy the solution
    * `aws cloudformation deploy --template-file appsync-timestream-example/packaged-template.yaml --stack-name appsync-timestream-api --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND`

4. Retrieve the details. Please note down the GraphQL endpoint and API key for testing purpose
    * `aws cloudformation describe-stacks --stack-name appsync-timestream-api --query "Stacks[0].Outputs" --output table`

## Test the example

You can test an AppSync API using below multiple options. 

**AppSync Console**

Navigate to AppSync console and select on the API name to view the dashboard for your API. Next click on Queries in the left-hand menu to view the query editor. From here, we can test out the API by running the following queries:

***GraphQL***

`
query getSensorData {
  getSensorData(durationInMinutes: 10) {
    time_in_epoch
    current_fuel_lvl_in_litres
    fleet
    fuel_capacity_in_litres
    load_capacity_in_tons
    make
    model
    truck_id
  }
}
`

**Command CLI**

You can use a curl to send a query via http post from the command line.

`curl -s -X POST https://<endpoint>.appsync-api.<AWS Region>.amazonaws.com/graphql -H "Content-Type:application/json"  -H "x-api-key:<API Key>" -d '{"query": "query GetSensorData($durationInMinutes: Int!){getSensorData(durationInMinutes: $dura-tionInMinutes){current_fuel_lvl_in_litres}}","variables":"{\"durationInMinutes\":\"10\"}"}'`

**Build a client application**

To learn how to build a client application refer [building a client application](https://docs.aws.amazon.com/appsync/latest/devguide/building-a-client-app.html)



### Clean up

In this blog post, we used a lambda function to simulate data at 2-minute interval. Hence, to avoid incurring future charges, clean up the resources created. To delete the CDK stack, use the following command. Since there are multiple stacks, you must explicitly specify a ‘--all’ option.

`aws cloudformation delete-stack --stack-name appsync-timestream-api`

### Conclusion

In this post, we learned how to create AppSync API to connect to the Timestream database and query the data. In doing so, we saw how to set up a direct lambda resolver to use direct Timestram APIs. Overall, using Amazon Timestream and AWS AppSync together can help you build scalable, high-performance applications that can efficiently store and retrieve large volumes of sensor data in near real-time. 

To learn more about Amazon AWS AppSync and Amazon Timestream, refer to [AWS AppSync documentation](https://aws.amazon.com/appsync/) and [Amazon Timestream documentation](https://aws.amazon.com/timestream/).  


## Security
See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License
This library is licensed under the MIT-0 License. See the LICENSE file.
