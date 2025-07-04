import requests
import random
import time
import os

def download_unsplash_image(word, download_dir="unsplash_images", client_id="YOUR_UNSPLASH_ACCESS_KEY"):
    """
    Downloads an image related to a given word from Unsplash.

    Args:
        word (str): The word to search for on Unsplash.
        download_dir (str): The directory where the image will be saved.
        client_id (str): Your Unsplash API Access Key.
                         Get it from: https://unsplash.com/developers
    """
    if not client_id or client_id == "YOUR_UNSPLASH_ACCESS_KEY":
        print("Error: Please replace 'YOUR_UNSPLASH_ACCESS_KEY' with your actual Unsplash Access Key.")
        print("You can get one from: https://unsplash.com/developers")
        return

    # Create the download directory if it doesn't exist
    if not os.path.exists(download_dir):
        os.makedirs(download_dir)
        print(f"Created directory: {download_dir}")

    # Unsplash API endpoint for searching photos
    search_url = f"https://api.unsplash.com/search/photos"

    headers = {
        "Authorization": f"Client-ID {client_id}"
    }

    params = {
        "query": word,
        "per_page": 1  # We only need one image
    }

    try:
        response = requests.get(search_url, headers=headers, params=params)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        data = response.json()

        if data and data['results']:
            # Get the URL of the regular-sized image
            image_url = data['results'][0]['urls']['regular']
            image_id = data['results'][0]['id']
            file_name = f"{word}.jpg"
            file_path = os.path.join(download_dir, file_name)

            print(f"Downloading image for '{word}' from: {image_url}")
            image_response = requests.get(image_url, stream=True)
            image_response.raise_for_status()

            with open(file_path, 'wb') as f:
                for chunk in image_response.iter_content(chunk_size=8192):
                    f.write(chunk)

            print(f"Image saved to: {file_path}")
        else:
            print(f"No image found on Unsplash for the word: '{word}'")

    except requests.exceptions.RequestException as e:
        print(f"An error occurred during the API request: {e}")
    except KeyError:
        print("Could not parse Unsplash API response. Check the API key and response structure.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# --- How to use this function ---
if __name__ == "__main__":
    # IMPORTANT: Replace with your actual Unsplash Access Key
    # 1. Go to https://unsplash.com/developers
    # 2. Register for a developer account.
    # 3. Create a new application.
    # 4. Find your "Access Key" in your application details.
    #key = "zoYoqwPpOKY50Cqo_IS2vXl3TWS6GTHZG9yepku1KYA" # <<< Jenn!
    key = "YqRUCbm1fvmsEJzmgrWCmXBTFn9upq94nRG30fSM-y8" # <<< Meme!

    # Example usage
    # download_unsplash_image("numbers", client_id=YOUR_ACCESS_KEY)


    s1 = ["head", "shoulders", "knees", "toes","hands", "elbow", "finger", "nose"]
    s2 = ["apple", "banana", "pear", "grape","cake", "bread", "milk", "juice"]
    s22 = ["spring", "summer", "autumn", "winter","sun", "snow", "rain", "leaf"]
    s3 = ["shirt", "pants", "socks", "hat","jacket", "shoes", "gloves", "scarf"]
    s4 = ["fish", "whale", "octopus", "shark","crab", "jellyfish", "turtle", "coral"]
    s5 = ["clock", "hour", "minute", "second","morning", "afternoon", "night", "evening"]
    s6 = ["one", "two", "three", "four","five", "six", "seven", "eight"]
    s7 = ["bus", "car", "truck", "train","bike", "boat", "plane", "van"]
    s8 = ["cow", "pig", "sheep", "chicken","tractor", "barn", "hay", "duck"]
    s9 = ["rocket", "moon", "star", "galaxy","planet", "comet", "alien", "satellite"]

    download_dir = "images"
    words_not_to_download = set()
    images_to_download = set(s2+s3+s4+s7+s8+s9+s1+s22+s5+s6)
    
    for img_name in os.listdir(download_dir):
        words_not_to_download.add(img_name.split('.')[0])

    images_to_download = images_to_download - words_not_to_download

    print(f"img count ={ len(images_to_download)}")

    for img in images_to_download:
        download_unsplash_image(img, client_id=key, download_dir=download_dir)
        time.sleep(random.randint(2, 4))


