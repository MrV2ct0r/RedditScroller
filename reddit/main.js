let after="";
let searched = false;

//input stuff
let subreddit;
document.getElementById("fetch").onclick = function () {
    if (document.getElementById("subreddit").value == "") {
        subreddit = "ProgrammerHumor";
        document.getElementById("subreddit").value = subreddit;
        searchInput();
    }
    else if (subreddit != document.getElementById("subreddit").value) {
        subreddit = document.getElementById("subreddit").value;
        after="";
    }
    
    searched = true;

    fetchContent();

}

document.getElementById("fetch-random").onclick = function () {
    
    searched = false;

    fetchRandomContent();
}

document.getElementById("isUser").onclick = function () {
    if (document.getElementById("isUser").checked) {
        document.getElementById("subreddit").placeholder = "Enter Username";
    }
    else
    {
        document.getElementById("subreddit").placeholder = "Enter Subreddit";
    }
}

document.getElementById("nsfw").onclick = function () {
    fetchRandomContent();
}

let autoscroll = false;
document.getElementById("autoscroll").onclick = function () {
    pageScroll();
    autoscroll = !autoscroll;
}


fetchRandomContent();

//fetch stuff
function fetchRandomContent() {
    //get a random line from "./subreddit parsed/parsedSubreddits.txt"
    let nsfw = document.getElementById("nsfw").checked;
    fetch("./subreddit parsed/"+(nsfw ? "nsfw" : "")+"parsedSubreddits.txt")
    .then(response => response.text())
    .then(body => {
        let lines = body.split("\n");
        let randomLine = lines[Math.floor(Math.random() * lines.length)];
        subreddit = randomLine;
        document.getElementById("subreddit").value = subreddit;
        document.getElementById("isUser").checked=false;
        after="";
        searchInput();
        fetchContent();
    });

}
function fetchContent() {
    
    console.log("fetching content...");


    while (document.getElementById("content")) {
        document.getElementById("content").remove();
    }

    let isUser = document.getElementById("isUser").checked ? "user" : "r";

    let parentDiv = document.createElement("div");
    parentDiv.id="content";
    fetch(`https://www.reddit.com/${isUser}/${subreddit}/.json?after=${after}&limit=50`)
    // fetch("https://www.reddit.com/r/ProgrammerHumor/top/.json?limit=100&after="+after)
    // fetch("https://www.reddit.com/r/memes.json")
    .then(response => response.json())
    .then(body => {
        after = body.data.after;
        for (let i = 0; i < body.data.children.length; i++) {
            if (body.data.children[i].data.post_hint == "image") {
                let div = document.createElement("div");
                let title = document.createElement("h4");
                let img = document.createElement("img");
                img.src = body.data.children[i].data.url_overridden_by_dest;
                title.textContent = body.data.children[i].data.title;

                div.appendChild(title);
                if (isUser == "user")
                {
                    let aSub = document.createElement("a");
                    aSub.href = `javascript:
                                subreddit="${body.data.children[i].data.subreddit}";
                                document.getElementById("subreddit").value = subreddit;
                                document.getElementById("isUser").checked=false;
                                after="";
                                fetchContent();`;
                    let sub = document.createElement("h5");
                    sub.textContent = body.data.children[i].data.subreddit;
                    aSub.appendChild(sub);
                    div.appendChild(aSub);
                }
                else
                {
                    let aUser = document.createElement("a");
                    aUser.href = `javascript:
                                subreddit="${body.data.children[i].data.author}";
                                document.getElementById("subreddit").value = subreddit;
                                document.getElementById("isUser").checked=true;
                                after="";
                                fetchContent();`;
                    let user = document.createElement("h5");
                    user.textContent = body.data.children[i].data.author;
                    aUser.appendChild(user);
                    div.appendChild(aUser);
                }
                
                div.appendChild(img);
                parentDiv.appendChild(div);
            }
        }

        //add a div to the bottom of parent div to make sure the scroll event is triggered
        let div = document.createElement("div");
        div.style.height = window.innerHeight+"px";
        div.style.width = "100%";
        parentDiv.appendChild(div);


        document.body.appendChild(parentDiv);
            

        //infinite scroll stuff
        document.getElementById('content').addEventListener('scroll', event => {
            const {scrollHeight, scrollTop, clientHeight} = event.target;

            console.log(Math.abs(scrollHeight - clientHeight - scrollTop));
            if (Math.abs(scrollHeight - clientHeight - scrollTop) <= 1) {
                console.log("bottom reached");
                if (searched || isUser == "user")
                {
                    fetchContent();
                }
                else
                {
                    fetchRandomContent();
                }
            }
        });

        //remove page blocker
        if (document.getElementById("pt-ext-root")) {
            document.getElementById("pt-ext-root").remove();
        }
    });

}

function pageScroll() {
    console.log("scrolling");
    if (document.getElementById("content") && autoscroll)
        document.getElementById("content").scrollBy(0,1);
    scrolldelay = setTimeout(pageScroll,10);
}

//string similarity stuff
function similarity(s1, s2) {

    //if one contains the other, return 1
    if (s1.includes(s2) || s2.includes(s1)) {
        return 1;
    }

    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
      return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
  }

  function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
      var lastValue = i;
      for (var j = 0; j <= s2.length; j++) {
        if (i == 0)
          costs[j] = j;
        else {
          if (j > 0) {
            var newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue),
                costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0)
        costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  function searchInput() {
    console.log("searching");
    let input = document.getElementById("subreddit").value;
    let isUser = document.getElementById("isUser").checked ? "user" : "r";
    let nsfw = document.getElementById("nsfw").checked;
    let similar_subreddits = [];
    let textBox = document.getElementById("similar-subreddits");

    fetch("./subreddit parsed/"+(nsfw ? "nsfw" : "")+"parsedSubreddits.txt")
    .then(response => response.text())
    .then(body => {
        //find 5 similar subreddits, sorted by similarity
        let lines = body.split("\n");
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let similarityScore = similarity(input, line);
            similar_subreddits.push({name: line, score: similarityScore});
        }

        similar_subreddits.sort((a, b) => (a.score > b.score) ? -1 : 1);
        similar_subreddits = similar_subreddits.slice(0, 10);

        textBox.innerHTML = "";
        for (let i = 0; i < similar_subreddits.length; i++) {
            let a = document.createElement("a");
            a.href = `javascript:
                        subreddit="${similar_subreddits[i].name}";
                        document.getElementById("subreddit").value = subreddit;
                        document.getElementById("isUser").checked=${isUser == "user"};
                        after="";
                        fetchContent();`;
            let h = document.createElement("h4");
            h.textContent = similar_subreddits[i].name;
            a.appendChild(h);
            textBox.appendChild(a);
        }


    });
  }