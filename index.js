import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

let title;
let ques_count;
let id;

env.config();
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/paper",(req,res) =>{
  res.redirect("/");
});

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/create", (req, res) => {
  res.render("create.ejs");
});

app.post("/create", async (req, res) => {
  let list = [];
  let result = await db.query("SELECT DISTINCT id FROM quiz;");
  // console.log(result.rows);
  for (let x = 0;x<result.rowCount;x++){
    list.push(result.rows[x].id);
  }
  // console.log(list);
  id = Math.floor(Math.random() * (999999 - 100000) ) + 100000;;
  while(id in list){
    id = Math.floor(Math.random() * (999999 - 100000) ) + 100000;
  }
  list.push(id);
  title = req.body.title;
  ques_count = req.body.ques_count;
  // console.log(id);
  // console.log(title);
  // console.log(ques_count);
  res.render("questions.ejs",{heading:title,qno:1});
});

app.get("/participate", (req, res) => {
  res.render("participate.ejs",{invalidity:""});
});

app.post("/paper", async (req, res) => {
  const id = req.body.quizid;
  // console.log(id);
  let valid = []
  let validity = await db.query("SELECT DISTINCT id FROM quiz;");
  for (let x = 0;x<validity.rowCount;x++){
    valid.push(validity.rows[x].id);
  }
  if (valid.includes(Number(id))){
    let qp = await db.query("SELECT * FROM quiz WHERE id = ($1) ORDER BY qno",[id]);
    // console.log(qp.rows); 
    // console.log(qp.rowCount); 
    return res.render("paper.ejs",{ques: qp.rows,no_ques:qp.rowCount});
  }
  res.render("participate.ejs",{invalidity:"    # Invalid Quiz ID"});
});

app.post("/evaluation", async (req, res) => {
  let ap;
  let marks = 0;
  try{
    ap = await db.query("SELECT * FROM quiz WHERE id = ($1) ORDER BY qno",[Number(req.body.id)]);
  } catch (err){
    return res.render("home.ejs");
  }
  const ans_sheet = req.body;
  delete ans_sheet.id;
  // console.log(ans_sheet);
  // console.log(ap.rows);
  let m = 0;
  for (let key in ans_sheet) {
    // console.log(ap.rows[m].question)
    // console.log(ap.rows[m].answer);
    // console.log(ans_sheet[key]);
    if(ap.rows[m].answer==ans_sheet[key]){
      marks+=1;
    }
    m+=1;
}

  res.render("evaluation.ejs",{score:marks,maximum:ap.rowCount});
});

let i = 2;
let qno = 1;
app.post("/update", async function (req, res) {
  if(id == null){
    return res.redirect("home.ejs");
  }
  let question = req.body.question;
  let option1 = req.body.option1;
  let option2 = req.body.option2;
  let option3 = req.body.option3;
  let option4 = req.body.option4;
  let answer = req.body.answer;
  try{
  await db.query("INSERT INTO quiz (id,title,question,option1,option2,option3,option4,answer,qno) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
  [id,title,question,option1,option2,option3,option4,answer,qno]
  );
  qno += 1;
  } catch(error){
    console.log(error);
    return res.status(500).send("An error occurred");
  }
  if(i<=ques_count){
    i+=1;
    return res.render("questions.ejs",{heading:title,qno:i-1});
  }
  res.render("submitted.ejs",{quiz_id:id});
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
