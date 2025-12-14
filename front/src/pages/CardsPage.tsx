import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  Center,
  Spinner,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { FiChevronLeft, FiChevronRight, FiArrowLeft } from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface CardItem {
  id: number;
  question: string;
  answer: string;
}

const CardsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [cards, setCards] = useState<CardItem[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<"left" | "right">("right");

  useEffect(() => {
    const fetchCards = async () => {
      const r = await fetch(`http://127.0.0.1:8000/cards/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        setCards(await r.json());
      }
      setLoading(false);
    };

    if (token) fetchCards();
  }, [token, id]);


  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === " ") {
        e.preventDefault();
        setShowAnswer((v) => !v);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const prev = () => {
    setDirection("left");
    setIndex((i) => Math.max(i - 1, 0));
    setShowAnswer(false);
  };

  const next = () => {
    setDirection("right");
    setIndex((i) => Math.min(i + 1, cards.length - 1));
    setShowAnswer(false);
  };

  if (loading) {
    return (
      <Center h="60vh">
        <Spinner size="lg" color="blue.500" />
      </Center>
    );
  }

  if (cards.length === 0) {
    return (
      <Center h="60vh">
        <Text color="gray.500">Карточки не найдены</Text>
      </Center>
    );
  }

  const card = cards[index];

  return (
    <Center py={10}>
      <Box
        w="100%"
        maxW="900px"
        bg="white"
        borderRadius="2xl"
        boxShadow="lg"
        borderWidth="1px"
        p={8}
      >

        <Flex justify="space-between" align="center" mb={6}>
          <Button
            leftIcon={<FiArrowLeft />}
            variant="ghost"
            onClick={() => navigate("/profile")}
          >
            В историю
          </Button>

          <Box textAlign="center">
            <Heading size="lg">Карточки</Heading>
            <Text color="gray.500">
              {index + 1} из {cards.length}
            </Text>
          </Box>

          <Box w="120px" />
        </Flex>


        <Box
          key={index}
          minH="340px"
          onClick={() => setShowAnswer((v) => !v)}
          sx={{
            perspective: "1000px",
            animation: "fadeSlide 0.35s ease",
            "@keyframes fadeSlide": {
              from: {
                opacity: 0,
                transform:
                  direction === "right"
                    ? "translateX(30px)"
                    : "translateX(-30px)",
              },
              to: {
                opacity: 1,
                transform: "translateX(0)",
              },
            },
          }}
        >
          <Box
            borderWidth="2px"
            borderColor="blue.400"
            borderRadius="2xl"
            h="340px"
            cursor="pointer"
            display="flex"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            sx={{
              position: "relative",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: showAnswer
                ? "rotateX(180deg)"
                : "rotateX(0deg)",
            }}
          >

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 10,
              }}
            >
              <Text fontSize="2xl" fontWeight="medium">
                {card.question}
              </Text>
            </Box>


            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                transform: "rotateX(180deg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 10,
              }}
            >
              <Text fontSize="xl" color="gray.700">
                {card.answer}
              </Text>
            </Box>
          </Box>
        </Box>

        <Text mt={4} fontSize="sm" color="gray.500" textAlign="center">
          Клик по карточке или пробел — показать ответ |  ← → — переключить карточку 
        </Text>


        <HStack justify="space-between" mt={8}>
          <Button onClick={prev} isDisabled={index === 0} variant="outline">
            <Icon as={FiChevronLeft} boxSize={6} />
          </Button>

          <Button
            onClick={next}
            isDisabled={index === cards.length - 1}
            variant="outline"
          >
            <Icon as={FiChevronRight} boxSize={6} />
          </Button>
        </HStack>
      </Box>
    </Center>
  );
};

export default CardsPage;
