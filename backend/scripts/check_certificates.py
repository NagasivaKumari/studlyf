import asyncio
from db import event_certificates_col, certificate_jobs_col

async def main():
    jobs = await certificate_jobs_col.find({}).sort('created_at', -1).to_list(length=10)
    certs = await event_certificates_col.find({'event_id': '6a103270211d257a21311d65'}).to_list(length=50)
    print('Jobs (latest):', len(jobs))
    for j in jobs[:5]:
        print(j.get('status'), j.get('created_at'))
    print('Certificates for event:', len(certs))
    for c in certs[:5]:
        print(c.get('certificate_id'), c.get('user_id'))

if __name__ == '__main__':
    asyncio.run(main())
