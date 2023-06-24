import { DynamoDBStreamEvent } from 'aws-lambda'

console.log('loading function')

export const handler = (event: DynamoDBStreamEvent): void => {
  event.Records.forEach((e) => {
    const eventName = e.eventName

    switch (eventName) {
      case 'INSERT': {
        console.log('inserted!!')
        break
      }
      case 'MODIFY': {
        console.log('updated!!')
        break
      }
      case 'REMOVE': {
        console.log('deleted!!')
        break
      }
    }
    console.log('DynamoDB Record: %j', e.dynamodb)
  })
}
