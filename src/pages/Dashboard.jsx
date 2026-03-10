import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import StatsCard from "../components/Statscard";
import { FiTrendingUp, FiTrendingDown, FiPlus, FiClock } from "react-icons/fi";
import { BsPeopleFill } from "react-icons/bs";
import { API_URL, apiFetch, getUser, getUserId } from "../utils/api";

