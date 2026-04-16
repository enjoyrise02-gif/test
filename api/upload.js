const { google } = require('googleapis');
const axios = require('axios');

export default async function handler(req, res) {
  // 1. 아임웹에서 보낸 POST 요청인지 확인
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // 2. 아임웹 웹훅 데이터 추출 (아임웹 표준 구조)
    // 입력폼에서 받은 파일 URL과 이름을 가져옵니다.
    const { file_url, file_name } = req.body;

    if (!file_url) {
      return res.status(400).json({ error: '파일 URL이 없습니다.' });
    }

    // 3. 구글 드라이브 권한 인증
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS), // Vercel 설정에서 넣을 값
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 4. 아임웹 서버에 있는 파일을 잠시 읽어오기
    const response = await axios({
      method: 'GET',
      url: file_url,
      responseType: 'stream',
    });

    // 5. 구글 드라이브로 업로드 실행
    const fileMetadata = {
      name: file_name || 'uploaded_file',
      parents: [process.env.GOOGLE_FOLDER_ID], // Vercel 설정에서 넣을 폴더 ID
    };

    const media = {
      mimeType: response.headers['content-type'],
      body: response.data,
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    return res.status(200).json({ success: true, fileId: file.data.id });
  } catch (error) {
    console.error('에러 발생:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
