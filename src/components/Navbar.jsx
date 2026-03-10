// src/components/Navbar.jsx
import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiLogOut, FiCamera } from "react-icons/fi";
import ScanReceipt from "./ScanReceipt";
import { API_URL, apiFetch, clearAuth, getUserId } from "../utils/api";

