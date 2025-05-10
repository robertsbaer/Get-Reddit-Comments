from flask import Flask, request, jsonify
import os
import praw
from dotenv import load_dotenv
from flask_cors import CORS

# load your .env variables
load_dotenv()

app = Flask(__name__)

# ← allows Access-Control-Allow-Origin: *
CORS(app)

# initialize PRAW (make sure your .env has REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT)
reddit = praw.Reddit(
    client_id    = os.getenv("REDDIT_CLIENT_ID"),
    client_secret= os.getenv("REDDIT_CLIENT_SECRET"),
    user_agent   = os.getenv("REDDIT_USER_AGENT")
)

@app.route("/get_comments")
def get_comments():
    username = request.args.get("username", "")
    limit    = int(request.args.get("limit", 25))
    try:
        user = reddit.redditor(username)
        comments = []
        for comment in user.comments.new(limit=limit):
            comments.append({
                "body"          : comment.body,
                "created_utc"   : comment.created_utc,
                "link_permalink": comment.permalink,
                "score"         : comment.score,
                "subreddit"     : str(comment.subreddit)
            })
        return jsonify({"comments": comments})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # listen on all interfaces, port 5000
    app.run(host="0.0.0.0", port=5001)

