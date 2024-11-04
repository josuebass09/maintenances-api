import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs';
import {StackProps, Stack} from 'aws-cdk-lib';
import {createBucket} from '../services/bucket';

export interface BucketObject {
    id: string,
    bucketName: string,
}

export class BucketStack extends Stack {
  private readonly bucket: Bucket[];
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    createBucket(this, this.getBuckets()[0]);
  }

  private getBuckets(): BucketObject[]{
    return [
      {
        bucketName: 'main-bucket-primary',
        id: 'main-bucket'
      }
    ];
  }
}
