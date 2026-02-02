import express from 'express';

const app = express();
const port = 8000;

// JSONミドルウェアの使用
app.use(express.json());

// ルートGETルート
app.get('/', (req, res) => {
    res.send('Expressサーバーが正常に動作しています。');
});

// サーバーの起動
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});