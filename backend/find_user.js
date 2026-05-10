import mongoose from 'mongoose';

async function findUser() {
  await mongoose.connect('mongodb://localhost:27017/devtrack');
  const user = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId('69ed65e8cfaebfc9bab3d76c') });
  console.log(JSON.stringify(user, null, 2));
  process.exit(0);
}

findUser().catch(console.error);
