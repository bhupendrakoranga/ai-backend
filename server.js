import express from 'express';
const app = express();

app.get('/', (req, res) => {
    res.send("Seaver is ready");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


