const express = require("express");
const postgres = require("postgres");
const z = require("zod");

const app = express();

app.use(express.json())
const port = 8000;
const sql = postgres({ db: "mydb", user: "postgres", password: "toor" });

// Schemas
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  about: z.string(),
  price: z.number().positive(),
});
const CreateProductSchema = ProductSchema.omit({ id: true });

app.post("/products", async (req, res) => {
  const result = await CreateProductSchema.safeParse(req.body);

  // If Zod parsed successfully the request body
  if (result.success) {
    const { name, about, price } = result.data;

    const product = await sql`
    INSERT INTO products (name, about, price)
    VALUES (${name}, ${about}, ${price})
    RETURNING *
    `;

    res.send(product[0]);
  } else {
    res.status(400).send(result);
  }
});

app.use(express.json()); // Middleware pour analyser le corps des requêtes en JSON

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// GET products/:id - Récupère un produit
app.get("/products/:id", async (req, res) => {
  const product = await sql`
    SELECT * FROM products WHERE id=${req.params.id}
    `;
 
  if (product.length > 0) {
    res.send(product[0]);
  } else {
    res.status(404).send({ message: "Not found" });
  }
});

//GET products/ - Récupère tous les produits
app.get("/products", async (req, res) => {
  const products = await sql`SELECT * FROM products`;
  res.json(products);
});

app.delete("/products/:id", async (req, res) => {
  const product = await sql`
    DELETE FROM products
    WHERE id=${req.params.id}
    RETURNING *
    `;

  if (product.length > 0) {
    res.send(product[0]);
  } else {
    res.status(404).send({ message: "Not found" });
  }
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
