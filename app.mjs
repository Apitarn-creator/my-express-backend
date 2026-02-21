import express from 'express';
import validatePost from './middlewares/validatePost.mjs'; 

const app = express();
const port = 4000;


app.use(express.json());

const postRouter = express.Router();


postRouter.post('/', validatePost, async (req, res) => {
  try {
    
    res.status(201).json({ message: "Post created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


postRouter.put('/:postId', validatePost, async (req, res) => {
  try {
    
    res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


app.use('/posts', postRouter);


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});