// Envia e apaga fotos no Cloudinary, um serviço externo de imagens.
// Usamos isso em vez de salvar no disco do servidor porque hospedagens
// como o Render apagam os arquivos locais toda vez que o servidor reinicia.
// No Cloudinary as fotos ficam permanentes, com um link direto (URL).
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Envia o arquivo (que chega na memória, via multer) para o Cloudinary.
// Retorna a URL pública da imagem e o "public_id" (necessário depois, caso
// a gente precise apagar essa imagem específica).
function uploadImage(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'loja-bela' }, // organiza as fotos numa pasta dentro do Cloudinary
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(fileBuffer);
  });
}

// Apaga uma imagem do Cloudinary pelo public_id (usado ao trocar de foto
// ou apagar um produto, para não acumular imagens não usadas).
async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Erro ao apagar imagem antiga do Cloudinary:', err.message);
  }
}

module.exports = { uploadImage, deleteImage };
