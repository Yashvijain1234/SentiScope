"""
generate_dataset.py
--------------------
Builds a labeled product-review dataset for training the sentiment model.

In a real production system you would use a public dataset such as the
IMDB Reviews or Amazon Product Reviews corpus. Because this project is fully
self-contained (no external downloads required), we synthesize a realistic
and varied dataset from templates + vocabulary. The combinations produce
thousands of unique, natural-sounding reviews with genuine signal that a
TF-IDF + Logistic Regression model can learn from.

Run:  python generate_dataset.py
Output: data/reviews.csv   (columns: text,label)  label in {positive, negative, neutral}
"""

import csv
import os
import random

random.seed(42)

PRODUCTS = [
    "phone", "laptop", "headphones", "camera", "blender", "backpack",
    "watch", "keyboard", "monitor", "chair", "jacket", "speaker",
    "vacuum", "coffee maker", "tablet", "router", "mouse", "charger",
    "smartwatch", "drone", "printer", "microwave", "toaster", "fan",
]

# ---- Positive building blocks -------------------------------------------------
POS_OPENERS = [
    "I absolutely love this {p}",
    "This {p} exceeded my expectations",
    "Best {p} I have ever owned",
    "Really happy with this {p}",
    "The {p} works perfectly",
    "I'm impressed by this {p}",
    "Couldn't be happier with my new {p}",
    "This {p} is fantastic",
    "Highly recommend this {p}",
    "Great value {p}",
]
POS_DETAILS = [
    "the quality is outstanding",
    "it feels premium and well built",
    "battery life is amazing",
    "setup was quick and easy",
    "it performs better than advertised",
    "the design is sleek and modern",
    "everything works flawlessly",
    "customer service was super helpful",
    "it arrived early and well packaged",
    "worth every penny",
    "the performance is incredibly fast",
    "I use it every day without any issues",
]
POS_CLOSERS = [
    "Would definitely buy again.",
    "Five stars!",
    "Highly recommended.",
    "So glad I bought it.",
    "A truly excellent purchase.",
    "Could not ask for more.",
    "Totally worth it.",
    "My friends are jealous now.",
]

# ---- Negative building blocks -------------------------------------------------
NEG_OPENERS = [
    "I'm very disappointed with this {p}",
    "This {p} stopped working after a week",
    "Worst {p} I have ever bought",
    "Do not buy this {p}",
    "The {p} is a complete waste of money",
    "Regret purchasing this {p}",
    "This {p} is terrible",
    "Really unhappy with this {p}",
    "The {p} broke almost immediately",
    "Save your money and skip this {p}",
]
NEG_DETAILS = [
    "the quality is awful",
    "it feels cheap and flimsy",
    "battery life is horrible",
    "setup was a nightmare",
    "it performs much worse than advertised",
    "the design is clunky and ugly",
    "nothing works as it should",
    "customer service was rude and useless",
    "it arrived late and damaged",
    "not worth the money at all",
    "the performance is painfully slow",
    "it keeps crashing and freezing",
]
NEG_CLOSERS = [
    "Would not recommend.",
    "One star.",
    "Avoid at all costs.",
    "I want a refund.",
    "A huge letdown.",
    "Never buying this brand again.",
    "Complete waste of time.",
    "Extremely frustrating experience.",
]

# Neutral filler shared by both classes. Real reviews are full of these
# sentiment-free phrases, which makes the model's job harder (more realistic).
NEUTRAL_FILLERS = [
    "I bought this last month",
    "it comes in a few colors",
    "shipping took a couple of days",
    "the box was a normal size",
    "I read a lot of reviews before buying",
    "my brother has the same model",
    "it runs on the usual batteries",
    "the manual is in several languages",
]

# Neutral openers/closers that give NO sentiment signal. Reviews built from
# these force the model to infer tone purely from the (mixable) details.
NEUTRAL_OPENERS = [
    "So I've been using this {p} for a while now",
    "Here are my thoughts on this {p}",
    "Picked up this {p} recently",
    "A quick update on the {p}",
    "Wanted to share my experience with this {p}",
]
NEUTRAL_CLOSERS = [
    "That's my honest take.",
    "Make of that what you will.",
    "Just my two cents.",
    "Hope this helps someone.",
    "Anyway, that's where I'm at.",
]

# Purely factual / descriptive details that carry NO sentiment. These are the
# body of a genuinely neutral review (a general statement, not praise or a
# complaint).
NEUTRAL_DETAILS = [
    "it is black with a small logo on the front",
    "it weighs about the same as the previous model",
    "the package included a charging cable and a manual",
    "it is roughly the size of my hand",
    "it has two ports on the side",
    "the warranty lasts for one year",
    "I mostly use it indoors on weekends",
    "it connects over bluetooth and wifi",
    "the price is similar to other brands",
    "it replaced an older unit I had",
    "it ships from a warehouse in another state",
    "the settings are adjusted through an app",
]


def make_review(openers, details, closers, opposite_details, confuse=False):
    product = random.choice(PRODUCTS)
    opener = random.choice(openers).format(p=product)
    n_details = random.randint(1, 2)
    chosen = random.sample(details, n_details)

    # ~18% of reviews are "mixed": they include one detail from the opposite
    # sentiment (e.g. a positive review that admits one downside). This is what
    # real reviews look like and forces the model to learn overall tone rather
    # than memorizing keywords.
    if confuse:
        chosen[0] = random.choice(opposite_details)

    parts = chosen[:]
    # Sprinkle in neutral, sentiment-free context ~40% of the time.
    if random.random() < 0.4:
        parts.insert(random.randint(0, len(parts)), random.choice(NEUTRAL_FILLERS))

    body = ", and ".join(parts)
    closer = random.choice(closers)
    return f"{opener}. {body[0].upper() + body[1:]}. {closer}"


def make_ambiguous_review():
    """A subtle review with neutral framing and a mix of pos/neg details.

    The label is whichever sentiment has more details (ties broken randomly),
    so these examples are genuinely hard and create realistic, non-perfect
    accuracy instead of trivially separable data.
    """
    product = random.choice(PRODUCTS)
    opener = random.choice(NEUTRAL_OPENERS).format(p=product)
    closer = random.choice(NEUTRAL_CLOSERS)

    n_pos = random.randint(0, 2)
    n_neg = random.randint(0, 2)
    if n_pos == 0 and n_neg == 0:
        n_pos = 1
    pos = random.sample(POS_DETAILS, n_pos)
    neg = random.sample(NEG_DETAILS, n_neg)
    details = pos + neg
    random.shuffle(details)

    if random.random() < 0.4:
        details.insert(random.randint(0, len(details)), random.choice(NEUTRAL_FILLERS))

    body = ", and ".join(details)
    text = f"{opener}. {body[0].upper() + body[1:]}. {closer}"

    if n_pos > n_neg:
        label = "positive"
    elif n_neg > n_pos:
        label = "negative"
    else:
        label = random.choice(["positive", "negative"])
    return text, label


def make_neutral_review():
    """A purely factual, sentiment-free statement about a product.

    Built only from neutral openers/details/fillers/closers, so it expresses
    no opinion at all (e.g. "Picked up this phone recently. It is black with a
    small logo on the front. Just my two cents."). These teach the model what
    a general statement looks like, as opposed to praise or a complaint.
    """
    product = random.choice(PRODUCTS)
    opener = random.choice(NEUTRAL_OPENERS).format(p=product)
    closer = random.choice(NEUTRAL_CLOSERS)

    n_details = random.randint(1, 2)
    details = random.sample(NEUTRAL_DETAILS, n_details)
    if random.random() < 0.5:
        details.insert(random.randint(0, len(details)), random.choice(NEUTRAL_FILLERS))

    body = ", and ".join(details)
    text = f"{opener}. {body[0].upper() + body[1:]}. {closer}"
    return text, "neutral"


def main():
    n_per_class = 2200
    n_ambiguous = 1200  # genuinely hard examples
    n_neutral = 2200  # purely factual, sentiment-free statements
    confuse_rate = 0.18
    label_noise = 0.04  # ~4% human-style mislabeling, like real datasets
    rows = []

    for _ in range(n_per_class):
        rows.append(
            (
                make_review(
                    POS_OPENERS, POS_DETAILS, POS_CLOSERS, NEG_DETAILS,
                    confuse=random.random() < confuse_rate,
                ),
                "positive",
            )
        )
        rows.append(
            (
                make_review(
                    NEG_OPENERS, NEG_DETAILS, NEG_CLOSERS, POS_DETAILS,
                    confuse=random.random() < confuse_rate,
                ),
                "negative",
            )
        )

    for _ in range(n_ambiguous):
        rows.append(make_ambiguous_review())

    for _ in range(n_neutral):
        rows.append(make_neutral_review())

    # Inject a small amount of label noise to mimic imperfect human annotation.
    # A mislabel flips to one of the *other* two classes at random.
    labels = ["positive", "negative", "neutral"]
    noisy = []
    for text, label in rows:
        if random.random() < label_noise:
            label = random.choice([l for l in labels if l != label])
        noisy.append((text, label))
    rows = noisy

    random.shuffle(rows)

    out_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "reviews.csv")

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} reviews to {out_path}")


if __name__ == "__main__":
    main()
