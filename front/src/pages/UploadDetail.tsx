import { useEffect, useState } from "react";
import { Box, Heading, Text, Spinner, Button } from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface UploadDetailData {
  filename: string;
  text: string;
}

const UploadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<UploadDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const r = await fetch(`http://127.0.0.1:8000/uploads/${id}/text`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          setData(await r.json());
        } else {
          setError("Ошибка загрузки текста PDF");
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
            setError("Ошибка сети: " + e.message);
        } else {
            setError("Неизвестная ошибка сети");
        }
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchData();
  }, [id, token]);

  if (loading) return <Spinner size="xl" />;
  if (error) return <Text color="red.500">{error}</Text>;
  if (!data) return null;

  return (
    <Box>
      <Button mb={4} onClick={() => navigate(-1)}>
        ← Назад
      </Button>
      <Heading mb={2}>{data.filename}</Heading>
      <Text whiteSpace="pre-wrap" border="1px solid #ddd" p={4} borderRadius="md" maxH="70vh" overflowY="auto">
        {data.text || "(Нет текста в PDF)"}
      </Text>
    </Box>
  );
};

export default UploadDetail;
