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
  const [openCardId, setOpenCardId] = useState<number | null>(null);
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
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      boxShadow="sm"
    >
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
        <Button colorScheme="blue" onClick={handleCreate}>
          Создать карточку
        </Button>
      </VStack>

      <VStack align="stretch" spacing={3}>
        {cards.map((card) => (
          <Box
            key={card.id}
            borderWidth="1px"
            borderRadius="lg"
            p={4}
            bg="gray.50"
            cursor="pointer"
            onClick={() =>
              setOpenCardId(openCardId === card.id ? null : card.id)
            }
          >
            <Text fontWeight="bold">{card.question}</Text>

            {openCardId === card.id && (
              <Text mt={2} color="gray.700">
                {card.answer}
              </Text>
            )}

            <HStack justify="end" mt={3}>
              <Button
                size="xs"
                colorScheme="red"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(card.id);
                }}
              >
                Удалить
              </Button>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default CardsPage;
