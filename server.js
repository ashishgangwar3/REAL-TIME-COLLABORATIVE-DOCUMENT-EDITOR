
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/collab-editor', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const DocumentSchema = new mongoose.Schema({
  content: String,
}, { timestamps: true });

const Document = mongoose.model('Document', DocumentSchema);

// REST endpoint to get or create document by ID
app.get('/document/:id', async (req, res) => {
  const docId = req.params.id;
  let doc = await Document.findById(docId);
  if (!doc) {
    doc = await Document.create({ _id: docId, content: '' });
  }
  res.json(doc);
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-document', async (docId) => {
    socket.join(docId);
    const document = await Document.findById(docId);
    if (document) {
      socket.emit('load-document', document.content);
    }
  });

  socket.on('send-changes', (docId, delta) => {
    socket.to(docId).emit('receive-changes', delta);
  });

  socket.on('save-document', async (docId, data) => {
    await Document.findByIdAndUpdate(docId, { content: data });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
