export const MAX_ROUNDS = 10;
export const ROUND_TIMER_SECONDS = 10;
export const MAX_LINES = 1;

export const PROMPT_DIFFICULTY_LEVELS: string[][] = [
  // Level 1: Simple, iconic shapes (30 prompts)
  [
    "cat", "house", "car", "tree", "sun", "cup", "cloud", "fish", "star", "boat",
    "ball", "key", "spoon", "door", "window", "bed", "table", "leaf", "moon", "mountain",
    "rainbow", "mushroom", "snail", "snake", "egg", "apple", "arrow", "circle", "square", "triangle"
  ],
  // Level 2: More detailed objects (30 prompts)
  [
    "flower with stem and leaves", "book with glasses on top", "key on a keychain", 
    "chair with a cushion", "bird on a branch", "banana peel", "heart with an arrow", 
    "bicycle with a basket", "acoustic guitar", "wizard hat", "teapot with steam", 
    "vintage camera", "old rotary telephone", "backpack with a zipper", "open umbrella", 
    "desk lamp", "a single sneaker", "ice cream cone with a scoop", "sailboat on water", 
    "fire truck with a ladder", "simple castle with towers", "lighthouse with a beam of light", 
    "windmill", "watering can", "coffee mug with steam", "a pair of scissors", 
    "open book on a stand", "butterfly with patterned wings", "spider in a web", "cactus in a pot"
  ],
  // Level 3: Complex / 3D-style objects (30 prompts)
  [
    "apple with a bite taken out", "crescent moon with a face", "a pair of socks", 
    "ornate door", "dining table with two chairs", "leaning ladder", "sunglasses", 
    "slice of pepperoni pizza", "cartoon rocket ship", "steam train",
    "bowl of fruit (apple, banana, orange)", "stack of pancakes with syrup", "computer mouse and keyboard",
    "toolbox with a hammer sticking out", "chess knight piece", "potted plant with detailed leaves",
    "birdcage with a bird inside", "motorcycle from the side", "microscope", "sewing machine",
    "grandfather clock", "violin with a bow", "vintage typewriter", "a single roller skate",
    "open treasure chest with coins", "glowing lantern", "knight's helmet", "spiral staircase",
    "rocking horse", "globe on a stand"
  ]
];

export const GUESSING_SYSTEM_PROMPT = `You are an AI drawing analyst. The user has drawn a sketch attempting to imitate one of four reference images.

Given:
- The user’s freehand sketch.
- The 4 reference images.
- The original text prompts used to generate those images.

Your task is to determine which of the 4 reference images the user was copying.

**Crucially, if the drawing is not a clear and recognizable attempt at any of the four images, you must give up.** Do not force a guess on a drawing that is ambiguous, nonsensical, or completely unrelated to the options.

Respond ONLY in the following format:
- On the first line, provide the index of the best match (1, 2, 3, or 4).
- **If you are giving up, provide the index 0.**
- On a new line, provide a short explanation (1–2 sentences) justifying your choice or your reason for giving up.

Be approximate and interpretively generous, but do not guess wildly. You are looking for clear intent.
`;