-- phpMyAdmin SQL Dump
-- version 5.1.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jul 14, 2022 at 08:09 AM
-- Server version: 10.4.19-MariaDB
-- PHP Version: 8.0.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nitin`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `active_status` tinyint(1) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int(11) NOT NULL,
  `salon_id` int(11) NOT NULL,
  `timing_id` int(11) NOT NULL,
  `date` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `default_work_hour`
--

CREATE TABLE `default_work_hour` (
  `id` int(11) NOT NULL,
  `salon_id` int(11) NOT NULL,
  `hour` int(11) DEFAULT NULL,
  `count` int(11) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `default_work_hour`
--

INSERT INTO `default_work_hour` (`id`, `salon_id`, `hour`, `count`, `active`) VALUES
(1, 1, 5, 3, 1);

-- --------------------------------------------------------

--
-- Table structure for table `rating`
--

CREATE TABLE `rating` (
  `id` int(10) NOT NULL,
  `rate` float NOT NULL,
  `message` text NOT NULL,
  `user_id` int(11) NOT NULL,
  `salon_id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `salons`
--

CREATE TABLE `salons` (
  `id` int(11) NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` longblob NOT NULL,
  `salt` longblob NOT NULL,
  `login_count` int(4) NOT NULL DEFAULT 0,
  `slot_disable_count` float NOT NULL DEFAULT 0,
  `isSlotsAlloted` tinyint(1) NOT NULL DEFAULT 0,
  `holiday` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `joined` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `salons`
--

INSERT INTO `salons` (`id`, `username`, `email`, `name`, `address`, `owner_name`, `phone`, `password`, `salt`, `login_count`, `slot_disable_count`, `isSlotsAlloted`, `holiday`, `last_login`, `joined`) VALUES
(1, 'chirag', 'chirag69@gmail.com', 'Chirag Salon Gwalior | bridal makeup | hair salon in Gwalior', '4 Khedapati Road, Phool Bagh Rd, opposite Patrika Office, Ravi Nagar, Gwalior, Madhya Pradesh 474002', 'Chirag Sharma', '07512448000', 0xa7360f81cb7655e8164869dcb388cb559da0e1482efa38516e50d40768db34cc, 0x07fc2cdc091c90a0c6e7a03163cdfaf2, 40, 2.5, 1, 0, '2022-06-25 9:40:02 am', '2022-03-22 18:36:56'),
(2, 'ravi', 'ravisankar89@gmail.com', 'Central India Salon Ravi Nagar Branch', ' D-14 , DWARIKA PURI COLONY, near KHEDAPATI MANDIR (PAL DAIRY, Phool Bagh, Gwalior, Madhya Pradesh 474002', 'Ravi Sankar', '9630875117', 0x1888adf3f9af0392e7f37c868c21e5960d90c6d76d8b0a5fc52fb393f0227eae, 0x5af8f0d1b325b8703397de4a1d949910, 0, 0, 0, 1, '2022-03-24 19:27:25', '2022-03-22 18:36:56'),
(5, 'rishab', 'rishabjain@gmail.com', 'M Top-N-Town Hair&beauty salon', 'gurdwara, Ashiyana Complex Near moti places pholbhag, Jayendraganj, Lashkar, Gwalior, Madhya Pradesh 474001', 'Rishab Jain', '09755765655', 0xc901fe036591fc5be405a15f087a9d9c490386bbb28158c7ecb9716b8e32f722, 0xc1728e1c98641b87dc008e9b8581fc97, 0, 0, 0, 1, '2022-03-24 19:27:25', '2022-03-22 18:36:56'),
(6, 'ajay', 'ajay12@gmail.com', 'Modern Hair Saloon', 'S.P. Ashram Road, Vinay Nagar-2, Gwalior, Madhya Pradesh 474012', 'Ajay Shivhare', '09425482631', 0xe588427bf823c01c946796b1430a77f44a030bf28d7dcee5ab47cd47c25b54e6, 0xae534d5e44d08a82832dad7dd564ac86, 0, 0, 0, 1, '2022-03-24 19:27:25', '2022-03-22 18:36:56');

-- --------------------------------------------------------

--
-- Table structure for table `timings`
--

CREATE TABLE `timings` (
  `id` int(11) NOT NULL,
  `slot_time` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slot_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position_count` float NOT NULL,
  `salon_id` int(11) DEFAULT NULL,
  `available` tinyint(1) NOT NULL DEFAULT 1,
  `count` int(3) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `timings`
--

INSERT INTO `timings` (`id`, `slot_time`, `slot_type`, `position_count`, `salon_id`, `available`, `count`, `active`, `status`, `date`) VALUES
(59, '12:00 pm-1:00 pm', 'one hour', 1, 1, 0, 4, 0, 'dismissed', '2022-05-12'),
(60, '1:00 pm-2:00 pm', 'one hour', 2, 1, 1, 4, 1, 'Enabled', '2022-05-12'),
(61, '2:00 pm-2:30 pm', 'half hour', 3, 1, 1, 4, 1, 'Enabled', '2022-05-12'),
(62, '2:30 pm-3:00 pm', 'half hour', 4, 1, 0, 4, 0, 'dismissed', '2022-05-12'),
(63, '3:00 pm-3:30 pm', 'half hour', 5, 1, 0, 4, 0, 'dismissed', '2022-05-12'),
(64, '3:30 pm-4:00 pm', 'half hour', 6, 1, 1, 4, 1, 'Enabled', '2022-05-12'),
(65, '4:00 pm-4:30 pm', 'half hour', 7, 1, 1, 4, 1, 'Enabled', '2022-05-12'),
(66, '4:30 pm-5:00 pm', 'half hour', 8, 1, 1, 4, 1, 'Enabled', '2022-05-12'),
(67, '12:00 pm-12:30 pm', 'half hour', 1, 1, 1, 4, 1, 'Enabled', '2022-05-12'),
(68, '12:30 pm-1:00 pm', 'half hour', 1.5, 1, 1, 4, 1, 'Enabled', '2022-05-12'),
(69, '2:30 pm-3:30 pm', 'one hour', 4, 1, 1, 4, 1, 'Enabled', '2022-05-12');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` longblob NOT NULL,
  `salt` longblob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `name`, `email`, `password`, `salt`) VALUES
(11, 'nitin', 'Nitin goswami', 'nitingoswami1900@gmail.com', 0xe9242d96a778a0164b22f373d4ac1dbcafa1bd793107f4e464e113f693da1dfe, 0xcd23be62793108338a29e63b5e44d3b1),
(12, 'shayna', 'Shayna chhari', 'shaynachhari@gmail.com', 0xa176617c54cfe7091a9fbbc9d18d10ef1287c17a7b0fa086229656b83e08c122, 0xb6465277802aa0adc11f21c95844b9eb),
(13, 'nik', 'Nitin goswami', 'nitingoswami@nikchat.online', 0xbe6d728c9f5f7953863521e9a666910587ce7d999a1c525ef52b8764a36e8f12, 0x00e8473cc5bbfa550e6afd1fc8be2fd9),
(14, 'nishant', 'Nishant Goswami', 'nishantjogoswami@gmail.com', 0x1f0547f6d1f77cda07f40760cec2ee8c693f61553c2cd8358ff01c36e91dfc07, 0x8beefd1aaea61178c3f7e1b09adfa343);

-- --------------------------------------------------------

--
-- Table structure for table `work_hour`
--

CREATE TABLE `work_hour` (
  `id` int(11) NOT NULL,
  `salon_id` int(11) NOT NULL,
  `hour` int(11) DEFAULT NULL,
  `count` int(11) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `work_hour`
--

INSERT INTO `work_hour` (`id`, `salon_id`, `hour`, `count`, `active`) VALUES
(4, 1, 5, 4, 1),
(5, 1, 5, 3, 1),
(6, 1, 5, 3, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_userAppointments` (`user_id`),
  ADD KEY `FK_salonAppointments` (`salon_id`),
  ADD KEY `FK_timingAppointment` (`timing_id`);

--
-- Indexes for table `default_work_hour`
--
ALTER TABLE `default_work_hour`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_SalonDefaultWork` (`salon_id`);

--
-- Indexes for table `rating`
--
ALTER TABLE `rating`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Fk_UserRating` (`user_id`),
  ADD KEY `Fk_SalonRating` (`salon_id`),
  ADD KEY `FK_AppointmentRating` (`appointment_id`);

--
-- Indexes for table `salons`
--
ALTER TABLE `salons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `salon_username` (`username`);

--
-- Indexes for table `timings`
--
ALTER TABLE `timings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_salonTime` (`salon_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `work_hour`
--
ALTER TABLE `work_hour`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_salonHour` (`salon_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=154;

--
-- AUTO_INCREMENT for table `rating`
--
ALTER TABLE `rating`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `salons`
--
ALTER TABLE `salons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `timings`
--
ALTER TABLE `timings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `work_hour`
--
ALTER TABLE `work_hour`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `FK_salonAppointments` FOREIGN KEY (`salon_id`) REFERENCES `salons` (`id`),
  ADD CONSTRAINT `FK_timingAppointment` FOREIGN KEY (`timing_id`) REFERENCES `timings` (`id`),
  ADD CONSTRAINT `FK_userAppointments` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `default_work_hour`
--
ALTER TABLE `default_work_hour`
  ADD CONSTRAINT `FK_SalonDefaultWork` FOREIGN KEY (`salon_id`) REFERENCES `salons` (`id`);

--
-- Constraints for table `rating`
--
ALTER TABLE `rating`
  ADD CONSTRAINT `FK_AppointmentRating` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`),
  ADD CONSTRAINT `Fk_SalonRating` FOREIGN KEY (`salon_id`) REFERENCES `salons` (`id`),
  ADD CONSTRAINT `Fk_UserRating` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `timings`
--
ALTER TABLE `timings`
  ADD CONSTRAINT `FK_salonTime` FOREIGN KEY (`salon_id`) REFERENCES `salons` (`id`);

--
-- Constraints for table `work_hour`
--
ALTER TABLE `work_hour`
  ADD CONSTRAINT `FK_salonHour` FOREIGN KEY (`salon_id`) REFERENCES `salons` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
