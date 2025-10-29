import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  Heading,
  HStack,
  useToast,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Card {
  id: number;
  question: string;
  answer: string;
}

const CardsPage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const toast = useToast();

  const fetchCards = async () => {
    const r = await fetch(`http://127.0.0.1:8000/cards/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      setCards(await r.json());
    }
  };

  useEffect(() => {
    if (token && id) fetchCards();
  }, [token, id]);

  const handleCreate = async () => {
    if (!question || !answer) {
      toast({ title: "Заполните оба поля", status: "warning" });
      return;
    }

    const r = await fetch(`http://127.0.0.1:8000/cards/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ question, answer }),
    });

    if (r.ok) {
      toast({ title: "Карточка создана", status: "success" });
      setQuestion("");
      setAnswer("");
      fetchCards();
    } else {
      toast({ title: "Ошибка создания карточки", status: "error" });
    }
  };

  const handleDelete = async (cardId: number) => {
    const r = await fetch(`http://127.0.0.1:8000/cards/${cardId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      toast({ title: "Карточка удалена", status: "success" });
      setCards(cards.filter((c) => c.id !== cardId));
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth="1px" borderRadius="lg">
      <Heading size="lg" mb={6} textAlign="center">
        Карточки по файлу №{id}
      </Heading>

      <VStack spacing={3} mb={6}>
        <Input
          placeholder="Вопрос"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Input
          placeholder="Ответ"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <Button colorScheme="teal" onClick={handleCreate}>
          Создать карточку
        </Button>
      </VStack>

      {cards.length === 0 ? (
        <Text textAlign="center" color="gray.500">
          Карточек пока нет
        </Text>
      ) : (
        <VStack align="stretch" spacing={3}>
          {cards.map((card) => (
            <Box
              key={card.id}
              borderWidth="1px"
              borderRadius="md"
              p={3}
              bg="gray.50"
            >
              <Text fontWeight="bold">Вопрос: {card.question}</Text>
              <Text>Ответ: {card.answer}</Text>
              <HStack justify="end" mt={2}>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleDelete(card.id)}
                >
                  Удалить
                </Button>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default CardsPage;
