import { query } from "./db";

export type Photo = {
  id: string;
  image_url: string;
  image_alt: string | null;
  caption: string | null;
  posted_at: string;
  created_at: string;
};

export async function getPhotos(): Promise<Photo[]> {
  return query<Photo>(`SELECT * FROM photos ORDER BY posted_at DESC`);
}

export async function addPhoto(
  imageUrl: string,
  caption: string | null,
  alt: string | null
): Promise<Photo> {
  const rows = await query<Photo>(
    `INSERT INTO photos (image_url, caption, image_alt)
     VALUES ($1, $2, $3) RETURNING *`,
    [imageUrl, caption, alt]
  );
  return rows[0];
}

export async function updatePhotoImage(
  id: string,
  imageUrl: string
): Promise<void> {
  await query(`UPDATE photos SET image_url = $1 WHERE id = $2`, [imageUrl, id]);
}

export async function deletePhoto(id: string): Promise<void> {
  await query(`DELETE FROM photos WHERE id = $1`, [id]);
}
