import { S3Event } from 'aws-lambda'
import { S3Client, GetObjectCommand, GetObjectOutput } from '@aws-sdk/client-s3'

export const handler = async (event: S3Event): Promise<string> => {
  const s3 = new S3Client({ region: 'ap-northeast-1' })
  const bucketName = event.Records[0].s3.bucket.name
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, ' ')
  )
  const params = {
    Bucket: bucketName,
    Key: key,
  }

  try {
    const response: GetObjectOutput = await s3.send(
      new GetObjectCommand(params)
    )
    const contentType = response.ContentType

    if (contentType === undefined) {
      throw new Error('Failed to retrieve content type from the S3 object.')
    }

    console.log('CONTENT TYPE:', contentType)
    return contentType
  } catch (err) {
    console.log(err)
    const message = `Error getting object ${key} from bucket ${bucketName}. Make sure they exist and your bucket is in the same region as this function.`
    console.log(message)
    throw new Error(message)
  }
}
