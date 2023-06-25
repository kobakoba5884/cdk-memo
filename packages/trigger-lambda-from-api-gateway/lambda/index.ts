import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda'

console.log('loading function')

const bucketName: string = process.env.BUCKET_NAME || 'bucket env is not exited'
const s3Client = new S3Client({})

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Received event:', JSON.stringify(event, null, 2))
  console.log(`bucketName: ${bucketName}`)

  try {
    const method = event.httpMethod

    if (method === 'GET') {
      if (event.path === '/') {
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 1,
        })

        const response = await s3Client.send(command)

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response.Contents),
        }
      } else {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid path' }),
        }
      }
    } else {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid HTTP Method' }),
      }
    }
  } catch (err) {
    console.log(err)

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }
  }
}
