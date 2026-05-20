import os
import json
try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None
import httpx
import asyncio


async def main():
    root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
    if load_dotenv and os.path.exists(root_env):
        try:
            load_dotenv(root_env, override=False)
        except Exception:
            pass

    api_url = os.getenv('API_BASE_URL', 'http://localhost:8000')
    print(f'Testing API endpoint: {api_url}/api/courses')
    print()

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f'{api_url}/api/courses', timeout=10.0)
            print(f'Status Code: {response.status_code}')
            
            if response.status_code == 200:
                courses = response.json()
                print(f'Total courses returned: {len(courses)}')
                print()
                for i, course in enumerate(courses, 1):
                    print(f'Course {i}: {course.get("title")} (ID: {course.get("_id")})')
            else:
                print(f'Error: {response.text}')
        except Exception as e:
            print(f'Error connecting to API: {e}')


if __name__ == '__main__':
    asyncio.run(main())
