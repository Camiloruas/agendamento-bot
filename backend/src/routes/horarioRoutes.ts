
import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { 
    getHorarios, 
    createOrUpdateHorarios,
    getDiasDisponiveis,
    getHorariosDisponiveis,
} from "../controllers/horarioController";

const router = Router();


router.get("/", protect, getHorarios);


router.post("/", protect, createOrUpdateHorarios);




router.get("/dias-disponiveis/:profissionalId", protect, getDiasDisponiveis);


router.get("/horarios-disponiveis/:profissionalId/:date", protect, getHorariosDisponiveis);

export default router;
