-- MySQL dump 10.13  Distrib 8.0.41, for Linux (x86_64)
--
-- Host: localhost    Database: karsafar_db
-- ------------------------------------------------------
-- Server version	8.0.41-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accomamenitymap`
--

DROP TABLE IF EXISTS `accomamenitymap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accomamenitymap` (
  `accomId` binary(16) NOT NULL,
  `amenityId` binary(16) NOT NULL,
  PRIMARY KEY (`accomId`,`amenityId`),
  KEY `amenityId` (`amenityId`),
  CONSTRAINT `accomamenitymap_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE,
  CONSTRAINT `accomamenitymap_ibfk_2` FOREIGN KEY (`amenityId`) REFERENCES `accommodationamenities` (`amenityId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accomamenitymap`
--

LOCK TABLES `accomamenitymap` WRITE;
/*!40000 ALTER TABLE `accomamenitymap` DISABLE KEYS */;
/*!40000 ALTER TABLE `accomamenitymap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accombookingrooms`
--

DROP TABLE IF EXISTS `accombookingrooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accombookingrooms` (
  `bookingRoomId` binary(16) NOT NULL,
  `accomItemId` binary(16) NOT NULL,
  `roomId` binary(16) NOT NULL,
  `roomNumber` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`bookingRoomId`),
  KEY `accomItemId` (`accomItemId`),
  KEY `roomId` (`roomId`),
  CONSTRAINT `accombookingrooms_ibfk_1` FOREIGN KEY (`accomItemId`) REFERENCES `accommodationbookingitems` (`accomItemId`) ON DELETE CASCADE,
  CONSTRAINT `accombookingrooms_ibfk_2` FOREIGN KEY (`roomId`) REFERENCES `rooms` (`roomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accombookingrooms`
--

LOCK TABLES `accombookingrooms` WRITE;
/*!40000 ALTER TABLE `accombookingrooms` DISABLE KEYS */;
/*!40000 ALTER TABLE `accombookingrooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accommodationaddresses`
--

DROP TABLE IF EXISTS `accommodationaddresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accommodationaddresses` (
  `addressId` binary(16) NOT NULL,
  `accomId` binary(16) NOT NULL,
  `street` varchar(100) NOT NULL,
  `landmark` varchar(100) DEFAULT NULL,
  `city` varchar(50) NOT NULL,
  `state` varchar(50) DEFAULT NULL,
  `pinCode` varchar(10) DEFAULT NULL,
  `country` varchar(50) NOT NULL,
  PRIMARY KEY (`addressId`),
  KEY `accomId` (`accomId`),
  CONSTRAINT `accommodationaddresses_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accommodationaddresses`
--

LOCK TABLES `accommodationaddresses` WRITE;
/*!40000 ALTER TABLE `accommodationaddresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `accommodationaddresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accommodationamenities`
--

DROP TABLE IF EXISTS `accommodationamenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accommodationamenities` (
  `amenityId` binary(16) NOT NULL,
  `amenityType` varchar(50) NOT NULL,
  PRIMARY KEY (`amenityId`),
  UNIQUE KEY `amenityType` (`amenityType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accommodationamenities`
--

LOCK TABLES `accommodationamenities` WRITE;
/*!40000 ALTER TABLE `accommodationamenities` DISABLE KEYS */;
/*!40000 ALTER TABLE `accommodationamenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accommodationbookingitems`
--

DROP TABLE IF EXISTS `accommodationbookingitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accommodationbookingitems` (
  `accomItemId` binary(16) NOT NULL,
  `accomId` binary(16) NOT NULL,
  `checkInDate` date NOT NULL,
  `checkOutDate` date NOT NULL,
  `contactName` varchar(100) NOT NULL,
  `contactPhoneNo` varchar(15) NOT NULL,
  `contactEmail` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` enum('confirmed','pending','cancelled') DEFAULT 'pending',
  PRIMARY KEY (`accomItemId`),
  KEY `accomId` (`accomId`),
  CONSTRAINT `accommodationbookingitems_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accommodationbookingitems`
--

LOCK TABLES `accommodationbookingitems` WRITE;
/*!40000 ALTER TABLE `accommodationbookingitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `accommodationbookingitems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accommodationphotos`
--

DROP TABLE IF EXISTS `accommodationphotos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accommodationphotos` (
  `photoId` binary(16) NOT NULL,
  `accomId` binary(16) NOT NULL,
  `photoUrl` varchar(255) NOT NULL,
  PRIMARY KEY (`photoId`),
  KEY `accomId` (`accomId`),
  CONSTRAINT `accommodationphotos_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accommodationphotos`
--

LOCK TABLES `accommodationphotos` WRITE;
/*!40000 ALTER TABLE `accommodationphotos` DISABLE KEYS */;
/*!40000 ALTER TABLE `accommodationphotos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accommodations`
--

DROP TABLE IF EXISTS `accommodations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accommodations` (
  `accomId` binary(16) NOT NULL,
  `accomType` enum('hotel','airbnb') NOT NULL,
  `name` varchar(100) NOT NULL,
  `phoneNo` varchar(15) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`accomId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accommodations`
--

LOCK TABLES `accommodations` WRITE;
/*!40000 ALTER TABLE `accommodations` DISABLE KEYS */;
/*!40000 ALTER TABLE `accommodations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `airbnbs`
--

DROP TABLE IF EXISTS `airbnbs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `airbnbs` (
  `accomId` binary(16) NOT NULL,
  `maxAllowedGuests` int NOT NULL,
  PRIMARY KEY (`accomId`),
  CONSTRAINT `airbnbs_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `airbnbs`
--

LOCK TABLES `airbnbs` WRITE;
/*!40000 ALTER TABLE `airbnbs` DISABLE KEYS */;
/*!40000 ALTER TABLE `airbnbs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookingitems`
--

DROP TABLE IF EXISTS `bookingitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookingitems` (
  `bookingItemId` binary(16) NOT NULL,
  `bookingId` binary(16) NOT NULL,
  `itemType` enum('vehicle','accommodation') NOT NULL,
  `vehicleItemId` binary(16) DEFAULT NULL,
  `accomItemId` binary(16) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`bookingItemId`),
  KEY `bookingId` (`bookingId`),
  KEY `vehicleItemId` (`vehicleItemId`),
  KEY `accomItemId` (`accomItemId`),
  CONSTRAINT `bookingitems_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`bookingId`) ON DELETE CASCADE,
  CONSTRAINT `bookingitems_ibfk_2` FOREIGN KEY (`vehicleItemId`) REFERENCES `vehiclebookingitems` (`vehicleItemId`) ON DELETE SET NULL,
  CONSTRAINT `bookingitems_ibfk_3` FOREIGN KEY (`accomItemId`) REFERENCES `accommodationbookingitems` (`accomItemId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookingitems`
--

LOCK TABLES `bookingitems` WRITE;
/*!40000 ALTER TABLE `bookingitems` DISABLE KEYS */;
INSERT INTO `bookingitems` VALUES (_binary '.Ω\çÆΩHS†¨ä\ıt‹Å',_binary '˝øL5kKµ()ÖΩå\ﬂ','vehicle',_binary '4˙@&\·\Ì@B¶\Ê\≈n\‡ü\ﬂF',NULL,8750.00),(_binary '”ùx ºC™Ø\Ô\Ù!\¬0\',_binary 'ùU7\'\‰H¸Çwå\'∂pØ','vehicle',_binary '31ÏÇ†\rJ+∑ºYùº˚\»:',NULL,1250.00);
/*!40000 ALTER TABLE `bookingitems` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_insert_bookingItems` BEFORE INSERT ON `bookingitems` FOR EACH ROW BEGIN
    
    IF (NEW.itemType = 'vehicle' AND (NEW.vehicleItemId IS NULL OR NEW.accomItemId IS NOT NULL)) OR
       (NEW.itemType = 'accommodation' AND (NEW.accomItemId IS NULL OR NEW.vehicleItemId IS NOT NULL)) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid itemType: vehicleItemId and accomItemId must match itemType';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_update_bookingItems` BEFORE UPDATE ON `bookingitems` FOR EACH ROW BEGIN
    
    IF (NEW.itemType = 'vehicle' AND (NEW.vehicleItemId IS NULL OR NEW.accomItemId IS NOT NULL)) OR
       (NEW.itemType = 'accommodation' AND (NEW.accomItemId IS NULL OR NEW.vehicleItemId IS NOT NULL)) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid itemType: vehicleItemId and accomItemId must match itemType';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `bookingId` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `tripId` binary(16) DEFAULT NULL,
  `totalPrice` decimal(10,2) NOT NULL,
  `status` enum('confirmed','pending','cancelled') DEFAULT 'pending',
  `createDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`bookingId`),
  KEY `userId` (`userId`),
  KEY `tripId` (`tripId`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`tripId`) REFERENCES `trips` (`tripId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (_binary 'ùU7\'\‰H¸Çwå\'∂pØ',_binary '\ÊR\÷!=M¸®R3x\ÔAK≠',NULL,1250.00,'pending','2025-04-19 18:16:10'),(_binary '˝øL5kKµ()ÖΩå\ﬂ',_binary '\ÊR\÷!=M¸®R3x\ÔAK≠',NULL,8750.00,'pending','2025-04-19 13:58:30');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `buses`
--

DROP TABLE IF EXISTS `buses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buses` (
  `vehicleId` binary(16) NOT NULL,
  `busName` varchar(100) NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`vehicleId`),
  CONSTRAINT `buses_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buses`
--

LOCK TABLES `buses` WRITE;
/*!40000 ALTER TABLE `buses` DISABLE KEYS */;
/*!40000 ALTER TABLE `buses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabs`
--

DROP TABLE IF EXISTS `cabs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cabs` (
  `vehicleId` binary(16) NOT NULL,
  `carModel` varchar(100) NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`vehicleId`),
  CONSTRAINT `cabs_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabs`
--

LOCK TABLES `cabs` WRITE;
/*!40000 ALTER TABLE `cabs` DISABLE KEYS */;
/*!40000 ALTER TABLE `cabs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cruises`
--

DROP TABLE IF EXISTS `cruises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cruises` (
  `vehicleId` binary(16) NOT NULL,
  `cruiseName` varchar(100) NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`vehicleId`),
  CONSTRAINT `cruises_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cruises`
--

LOCK TABLES `cruises` WRITE;
/*!40000 ALTER TABLE `cruises` DISABLE KEYS */;
/*!40000 ALTER TABLE `cruises` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flights`
--

DROP TABLE IF EXISTS `flights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flights` (
  `vehicleId` binary(16) NOT NULL,
  `flightName` varchar(100) NOT NULL,
  PRIMARY KEY (`vehicleId`),
  CONSTRAINT `flights_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flights`
--

LOCK TABLES `flights` WRITE;
/*!40000 ALTER TABLE `flights` DISABLE KEYS */;
INSERT INTO `flights` VALUES (_binary '\n,=N_j{åù*;L]','AI563'),(_binary '.=L[jéù\n,=N_j','G8905'),(_binary '.=L[jéù\n,=N_j{','6E345'),(_binary '<M^ozãú\r/:K\\m~è','QP234'),(_binary 'KZl}éü\n,=N_j{åù','TJ456'),(_binary '_ç:ú+AuπìMáß\Ò\Ë\“','AI101'),(_binary 'o~çú\Z/>M\\kzèû\r','SJ128'),(_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','SG302'),(_binary 'éj[L=.\nõå}n_J;','IX624'),(_binary 'ö{l]N?*ùéj[L=','UK787');
/*!40000 ALTER TABLE `flights` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotels`
--

DROP TABLE IF EXISTS `hotels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotels` (
  `accomId` binary(16) NOT NULL,
  `breakfastIncluded` tinyint(1) DEFAULT '0',
  `acType` enum('AC','NON-AC','BOTH') NOT NULL,
  PRIMARY KEY (`accomId`),
  CONSTRAINT `hotels_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotels`
--

LOCK TABLES `hotels` WRITE;
/*!40000 ALTER TABLE `hotels` DISABLE KEYS */;
/*!40000 ALTER TABLE `hotels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `passengerseats`
--

DROP TABLE IF EXISTS `passengerseats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `passengerseats` (
  `passengerId` binary(16) NOT NULL,
  `vehicleItemId` binary(16) NOT NULL,
  `seatId` binary(16) NOT NULL,
  `name` varchar(100) NOT NULL,
  `age` int NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `foodPreference` enum('veg','non-veg','vegan','none') DEFAULT 'none',
  PRIMARY KEY (`passengerId`),
  UNIQUE KEY `unique_vehicle_seat` (`vehicleItemId`,`seatId`),
  KEY `seatId` (`seatId`),
  CONSTRAINT `passengerseats_ibfk_1` FOREIGN KEY (`vehicleItemId`) REFERENCES `vehiclebookingitems` (`vehicleItemId`) ON DELETE CASCADE,
  CONSTRAINT `passengerseats_ibfk_2` FOREIGN KEY (`seatId`) REFERENCES `seats` (`seatId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passengerseats`
--

LOCK TABLES `passengerseats` WRITE;
/*!40000 ALTER TABLE `passengerseats` DISABLE KEYS */;
INSERT INTO `passengerseats` VALUES (_binary 'P1©\ÁM˝™~\Zu∞t§\Ô',_binary '31ÏÇ†\rJ+∑ºYùº˚\»:',_binary '°\0™ª\Ã\›\Óˇ\0\"3DUf','Aadish Jain',18,'male','veg'),(_binary 'ÉA\—W¢Boµ¨\ƒ˝\÷\“',_binary '4˙@&\·\Ì@B¶\Ê\≈n\‡ü\ﬂF',_binary '†\"3DUfwàô™ª\0\0\0\0','Aadish Jain',18,'male','veg');
/*!40000 ALTER TABLE `passengerseats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `paymentId` binary(16) NOT NULL,
  `bookingId` binary(16) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paid` tinyint(1) DEFAULT '0',
  `paymentMethod` varchar(50) DEFAULT NULL,
  `transactionId` varchar(100) DEFAULT NULL,
  `paymentDate` timestamp NULL DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  PRIMARY KEY (`paymentId`),
  KEY `bookingId` (`bookingId`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`bookingId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (_binary 'l£,\Í>Kü≠Üî\‰[\Ã',_binary 'ùU7\'\‰H¸Çwå\'∂pØ',1250.00,0,'upi',NULL,NULL,'pending'),(_binary '{Å.€Æ@r±õN\'\ƒ\À',_binary '˝øL5kKµ()ÖΩå\ﬂ',8750.00,0,'upi',NULL,NULL,'pending');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `reviewId` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `itemType` enum('vehicle','accommodation','trip') NOT NULL,
  `itemId` binary(16) NOT NULL,
  `rating` decimal(3,2) NOT NULL,
  `comment` text,
  `reviewDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reviewId`),
  UNIQUE KEY `unique_user_review` (`userId`,`itemType`,`itemId`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 0 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `roomId` binary(16) NOT NULL,
  `accomId` binary(16) NOT NULL,
  `roomType` varchar(50) NOT NULL,
  `roomsAvailable` int NOT NULL,
  `pplAccommodated` int NOT NULL,
  `roomDescription` text,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`roomId`),
  KEY `accomId` (`accomId`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`accomId`) REFERENCES `accommodations` (`accomId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seats`
--

DROP TABLE IF EXISTS `seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seats` (
  `seatId` binary(16) NOT NULL,
  `vehicleId` binary(16) NOT NULL,
  `coachId` varchar(5) NOT NULL,
  `seatNumber` varchar(5) NOT NULL,
  PRIMARY KEY (`seatId`),
  UNIQUE KEY `unique_seat` (`vehicleId`,`coachId`,`seatNumber`),
  KEY `coachId` (`coachId`),
  CONSTRAINT `seats_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE,
  CONSTRAINT `seats_ibfk_2` FOREIGN KEY (`coachId`) REFERENCES `vehiclecoaches` (`coachId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seats`
--

LOCK TABLES `seats` WRITE;
/*!40000 ALTER TABLE `seats` DISABLE KEYS */;
INSERT INTO `seats` VALUES (_binary '®\"3DUfwàô™ª\0\0\0\0',_binary '\n,=N_j{åù*;L]','BU108','1A'),(_binary 'π\"3DUfwàô™ª\Ã\0\0\0\0',_binary '\n,=N_j{åù*;L]','BU108','1B'),(_binary '¿3DUfwàô™ª\Ã\›\0\0\0\0',_binary '\n,=N_j{åù*;L]','BU108','2A'),(_binary '\—DUfwàô™ª\Ã\›\Ó\0\0\0\0',_binary '\n,=N_j{åù*;L]','BU108','2B'),(_binary '™DªU\Ãf\›w\Óàˇô\0\"3',_binary '\n,=N_j{åù*;L]','EC108','1A'),(_binary 'ªU\Ãf\›w\Óàˇô\0\"3\0\0',_binary '\n,=N_j{åù*;L]','EC108','1B'),(_binary '\Ãf\›w\Óàˇô\0\"3\0\0\0\0',_binary '\n,=N_j{åù*;L]','EC108','1C'),(_binary '\›w\Óàˇô\0\"3DU\0\0\0\0',_binary '\n,=N_j{åù*;L]','EC108','2A'),(_binary '\Óàˇô\0\"3DUfw\0\0\0\0',_binary '\n,=N_j{åù*;L]','EC108','2B'),(_binary 'ˇô\0\"3DUfwàô\0\0\0\0',_binary '\n,=N_j{åù*;L]','EC108','2C'),(_binary '\0Ufwàô™ª\Ã\›\Ó\0\0\0\0',_binary '.=L[jéù\n,=N_j','BU105','1A'),(_binary 'Ufwàô™ª\Ã\›\Óˇ\0\0\0\0',_binary '.=L[jéù\n,=N_j','BU105','1B'),(_binary '\"fwàô™ª\Ã\›\Óˇ\0\0\0\0\0',_binary '.=L[jéù\n,=N_j','BU105','2A'),(_binary '3wàô™ª\Ã\›\Óˇ\0\0\0\0\0',_binary '.=L[jéù\n,=N_j','BU105','2B'),(_binary '™ª\"\Ã3\›D\ÓUˇf\0U\0',_binary '.=L[jéù\n,=N_j','EC105','1A'),(_binary 'ª\"\Ã3\›D\ÓUˇf\0Uf\0\0',_binary '.=L[jéù\n,=N_j','EC105','1B'),(_binary '\Ã3\›D\ÓUˇf\0Uf\0\0\0\0',_binary '.=L[jéù\n,=N_j','EC105','1C'),(_binary '\›D\ÓUˇf\0Ufwà\0\0\0\0',_binary '.=L[jéù\n,=N_j','EC105','2A'),(_binary '\ÓUˇf\0Ufwàô™\0\0\0\0',_binary '.=L[jéù\n,=N_j','EC105','2B'),(_binary 'ˇf\0Ufwàô™ª\Ã\0\0\0\0',_binary '.=L[jéù\n,=N_j','EC105','2C'),(_binary 'Dàô\0ª\Ã\›\Óˇ\0\"\0\0\0\0',_binary '.=L[jéù\n,=N_j','FC105','1A'),(_binary 'Uô\0\Ã\›\Óˇ\0\"3\0\0\0\0',_binary '.=L[jéù\n,=N_j','FC105','1B'),(_binary '¥\0 ªDU\03DUfwàôª',_binary '*Nlé\n,Noä.Ojå/','AC304','LB01'),(_binary '≥\0™3DU\03DUfwà™',_binary '*Nlé\n,Noä.Ojå/','SL204','LB01'),(_binary '™\"3DUfwàô™ª\0\0\0\0',_binary '.=L[jéù\n,=N_j{','BU104','1A'),(_binary 'ª\"3DUfwàô™ª\Ã\0\0\0\0',_binary '.=L[jéù\n,=N_j{','BU104','1B'),(_binary '\Ã3DUfwàô™ª\Ã\›\0\0\0\0',_binary '.=L[jéù\n,=N_j{','BU104','2A'),(_binary '\›DUfwàô™ª\Ã\›\Ó\0\0\0\0',_binary '.=L[jéù\n,=N_j{','BU104','2B'),(_binary '™ª\"\Ã3\›D\ÓUˇf\0\"3',_binary '.=L[jéù\n,=N_j{','EC104','1A'),(_binary 'ª\"\Ã3\›D\ÓUˇf\0\"3\0\0',_binary '.=L[jéù\n,=N_j{','EC104','1B'),(_binary '\Ã3\›D\ÓUˇf\0\"3\0\0\0\0',_binary '.=L[jéù\n,=N_j{','EC104','1C'),(_binary '\›D\ÓUˇf\0\"3DU\0\0\0\0',_binary '.=L[jéù\n,=N_j{','EC104','2A'),(_binary '\ÓUˇf\0\"3DUfw\0\0\0\0',_binary '.=L[jéù\n,=N_j{','EC104','2B'),(_binary 'ˇf\0\"3DUfwàô\0\0\0\0',_binary '.=L[jéù\n,=N_j{','EC104','2C'),(_binary '§\"3DUfwàô™ª\0\0\0\0',_binary '<M^ozãú\r/:K\\m~è','BU107','1A'),(_binary 'µ\"3DUfwàô™ª\Ã\0\0\0\0',_binary '<M^ozãú\r/:K\\m~è','BU107','1B'),(_binary '™3ªD\ÃU\›f\Ówˇà\0\"3',_binary '<M^ozãú\r/:K\\m~è','EC107','1A'),(_binary 'ªD\ÃU\›f\Ówˇà\0\"3\0\0',_binary '<M^ozãú\r/:K\\m~è','EC107','1B'),(_binary '\ÃU\›f\Ówˇà\0\"3\0\0\0\0',_binary '<M^ozãú\r/:K\\m~è','EC107','1C'),(_binary '\›f\Ówˇà\0\"3DU\0\0\0\0',_binary '<M^ozãú\r/:K\\m~è','EC107','2A'),(_binary '\Ówˇà\0\"3DUfw\0\0\0\0',_binary '<M^ozãú\r/:K\\m~è','EC107','2B'),(_binary 'ˇà\0\"3DUfwàô\0\0\0\0',_binary '<M^ozãú\r/:K\\m~è','EC107','2C'),(_binary '\∆3DUfwàô™ª\Ã\›\0\0\0\0',_binary '<M^ozãú\r/:K\\m~è','FC107','1A'),(_binary '\◊DUfwàô™ª\Ã\›\Ó\0\0\0\0',_binary '<M^ozãú\r/:K\\m~è','FC107','1B'),(_binary '¿3DVfwàô™ª\Ã\›\0\0\0\0',_binary 'KZl}éü\n,=N_j{åù','BU110','1A'),(_binary '\—DUgwàô™ª\Ã\›\Ó\0\0\0\0',_binary 'KZl}éü\n,=N_j{åù','BU110','1B'),(_binary '\‚Ufxàô™ª\Ã\›\Óˇ\0\0\0\0',_binary 'KZl}éü\n,=N_j{åù','BU110','2A'),(_binary '\Ûfwâô™ª\Ã\›\Óˇ\0\0\0\0\0',_binary 'KZl}éü\n,=N_j{åù','BU110','2B'),(_binary '™fªwÃà›ô\Ó™ˇª\0\"3',_binary 'KZl}éü\n,=N_j{åù','EC110','1A'),(_binary 'ªwÃà›ô\Ó™ˇª\0\"3\0\0',_binary 'KZl}éü\n,=N_j{åù','EC110','1B'),(_binary 'Ãà›ô\Ó™ˇª\0\"3\0\0\0\0',_binary 'KZl}éü\n,=N_j{åù','EC110','1C'),(_binary '›ô\Ó™ˇª\0\"3DU\0\0\0\0',_binary 'KZl}éü\n,=N_j{åù','EC110','1D'),(_binary '\Ó™ˇª\0\"3DUfw\0\0\0\0',_binary 'KZl}éü\n,=N_j{åù','EC110','2A'),(_binary 'ˇª\0\"3DUfwàô\0\0\0\0',_binary 'KZl}éü\n,=N_j{åù','EC110','2B'),(_binary '®\"4DUfwàô™ª\0\0\0\0',_binary 'KZl}éü\n,=N_j{åù','EC110','2C'),(_binary 'π\"3EUfwàô™ª\Ã\0\0\0\0',_binary 'KZl}éü\n,=N_j{åù','EC110','2D'),(_binary '®\0ª\"3DUfwàô\0\"\›',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','AC201','LB01'),(_binary '©\0	\Ã3DUfwàô\0\"3\Ó',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','AC201','UB01'),(_binary '•\0\Óˇ\0\"3DUfwàô™',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','AC301','LB01'),(_binary '¶\0ˇ\0\"3DUfwàô\0ª',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','AC301','MB01'),(_binary 'ß\0™\"3DUfwàô\0\Ã',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','AC301','UB01'),(_binary '°\0™ª\Ã\›\Óˇ\0\"3DUf',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','SL201','LB01'),(_binary '§\0\›\Óˇ\0\"3DUfwàô',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','SL201','LB02'),(_binary '¢\0ª\Ã\›\Óˇ\0\"3DUfw',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','SL201','MB01'),(_binary '£\0\Ã\›\Óˇ\0\"3DUfwà',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','SL201','UB01'),(_binary '\Z+<M^ozãú\r/:K\\m',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','BU101','1A'),(_binary '+<M^ozãú\r/:K\\m~',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','BU101','1B'),(_binary '<M^ozãú\r/:K\\m~è',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','BU101','1C'),(_binary 'M^ozãú\r/:K\\m~èö',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','BU101','2A'),(_binary '^ozãú\r/:K\\m~èö',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','BU101','2B'),(_binary 'ozãú\r/:K\\m~èö',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','BU101','2C'),(_binary 'ùå{j_N=,\nüé}l[J',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','EC101','1A'),(_binary 'å{j_N=,\nüé}l[J?',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','EC101','1B'),(_binary '{j_N=,\nüé}l[J?.',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','EC101','1C'),(_binary 'j_N=,\nüé}l[J?.',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','EC101','1D'),(_binary '_N=,\nüé}l[J?.',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','EC101','2A'),(_binary 'N=,\nüé}l[J?.õ',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','EC101','2B'),(_binary '=,\nüé}l[J?.õä',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','EC101','2C'),(_binary ',\nüé}l[J?.õä',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','EC101','2D'),(_binary '\nüé}l[J?.õän',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','EC101','3A'),(_binary '\nüé}l[J?.õän]',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','EC101','3B'),(_binary '©¯\Á\÷≈¥£\Ú\·\–…∏ß\ˆ\Â\‘',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','EC101','3C'),(_binary 'üé}l[J?.õän]L',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','EC101','3D'),(_binary 'zãú\r/:K\\m~èö-',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','FC101','1A'),(_binary 'ãú\r/:K\\m~èö->',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','FC101','1B'),(_binary 'ú\r/:K\\m~èö->O',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','FC101','2A'),(_binary '\r/:K\\m~èö->OZ',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','FC101','2B'),(_binary '§\"0DUfwàô™ª\0\0\0\0',_binary 'o~çú\Z/>M\\kzèû\r','BU109','1A'),(_binary 'µ\"3AUfwàô™ª\Ã\0\0\0\0',_binary 'o~çú\Z/>M\\kzèû\r','BU109','1B'),(_binary '\∆3DRfwàô™ª\Ã\›\0\0\0\0',_binary 'o~çú\Z/>M\\kzèû\r','BU109','2A'),(_binary '\◊DUcwàô™ª\Ã\›\Ó\0\0\0\0',_binary 'o~çú\Z/>M\\kzèû\r','BU109','2B'),(_binary '™Uªf\Ãw›à\Óôˇ™\0\"3',_binary 'o~çú\Z/>M\\kzèû\r','EC109','1A'),(_binary 'ªf\Ãw›à\Óôˇ™\0\"3\0\0',_binary 'o~çú\Z/>M\\kzèû\r','EC109','1B'),(_binary '\Ãw›à\Óôˇ™\0\"3\0\0\0\0',_binary 'o~çú\Z/>M\\kzèû\r','EC109','1C'),(_binary '›à\Óôˇ™\0\"3DU\0\0\0\0',_binary 'o~çú\Z/>M\\kzèû\r','EC109','2A'),(_binary '\Óôˇ™\0\"3DUfw\0\0\0\0',_binary 'o~çú\Z/>M\\kzèû\r','EC109','2B'),(_binary 'ˇ™\0\"3DUfwàô\0\0\0\0',_binary 'o~çú\Z/>M\\kzèû\r','EC109','2C'),(_binary '™ª\Ã\›wàô™ª\Ã\›\Óˇ™ª\Ã',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','BU102','1A'),(_binary 'ª\Ã\›Óàô™ª\Ã\›\Óˇ™ª\Ã\›',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','BU102','1B'),(_binary '\Ã\›\Óˇô™ª\Ã\›\Óˇ™ª\Ã\›\Ó',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','BU102','2A'),(_binary '\›\Óˇ™™ª\Ã\›\Óˇ™ª\Ã\›\Óˇ',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','BU102','2B'),(_binary '™ª\Ã\›\"3DUfwàô™ª\Ã',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','EC102','1A'),(_binary 'ª\Ã\›\Ó\"3DUfwàô™ª\Ã\›',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','EC102','1B'),(_binary '\Ã\›\Óˇ3DUfwàô™ª\Ã\›\Ó',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','EC102','1C'),(_binary '\›\Óˇ™DUfwàô™ª\Ã\›\Óˇ',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','EC102','2A'),(_binary '\Óˇ™ªUfwàô™ª\Ã\›\Óˇ™',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','EC102','2B'),(_binary 'ˇ™ª\Ãfwàô™ª\Ã\›\Óˇ™ª',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','EC102','2C'),(_binary '≤\0ˇ\"3DU\03DUfwˇ',_binary 'å;jE1´B\ıé]\Ÿ=\\>ü','AC203','LB01'),(_binary '±\0\Ó\"3DU\03DUf\Ó',_binary 'å;jE1´B\ıé]\Ÿ=\\>ü','AC303','LB01'),(_binary '∞\0\›\0\"3DU\03DU\›',_binary 'å;jE1´B\ıé]\Ÿ=\\>ü','SL203','LB01'),(_binary '†\"3DUfwàô™ª\0\0\0\0',_binary 'éj[L=.\nõå}n_J;','BU106','1A'),(_binary '±\"3DUfwàô™ª\Ã\0\0\0\0',_binary 'éj[L=.\nõå}n_J;','BU106','1B'),(_binary '\¬3DUfwàô™ª\Ã\›\0\0\0\0',_binary 'éj[L=.\nõå}n_J;','BU106','2A'),(_binary '\”DUfwàô™ª\Ã\›\Ó\0\0\0\0',_binary 'éj[L=.\nõå}n_J;','BU106','2B'),(_binary '™\"ª3\ÃD\›U\Ófˇw\0\"3',_binary 'éj[L=.\nõå}n_J;','EC106','1A'),(_binary 'ª3\ÃD\›U\Ófˇw\0\"3\0\0',_binary 'éj[L=.\nõå}n_J;','EC106','1B'),(_binary '\ÃD\›U\Ófˇw\0\"3\0\0\0\0',_binary 'éj[L=.\nõå}n_J;','EC106','1C'),(_binary '\›U\Ófˇw\0\"3DU\0\0\0\0',_binary 'éj[L=.\nõå}n_J;','EC106','2A'),(_binary '\Ófˇw\0\"3DUfw\0\0\0\0',_binary 'éj[L=.\nõå}n_J;','EC106','2B'),(_binary 'ˇw\0\"3DUfwàô\0\0\0\0',_binary 'éj[L=.\nõå}n_J;','EC106','2C'),(_binary 'ô™ª\Ã\›\Óˇ\0\"3D\0\0\0\0',_binary 'ö{l]N?*ùéj[L=','BU103','1A'),(_binary '™ª\Ã\›\Óˇ\0\"3D\0\0\0\0\0',_binary 'ö{l]N?*ùéj[L=','BU103','1B'),(_binary 'ª\Ã\›\Óˇ\0\"3DU\0\0\0\0\0',_binary 'ö{l]N?*ùéj[L=','BU103','1C'),(_binary '\"3DUfwàô™ª\Ã\›\Óˇ\0',_binary 'ö{l]N?*ùéj[L=','EC103','1A'),(_binary '\"3DUfwàô™ª\Ã\›\Óˇ\0',_binary 'ö{l]N?*ùéj[L=','EC103','1B'),(_binary '3DUfwàô™ª\Ã\›\Óˇ\0\"',_binary 'ö{l]N?*ùéj[L=','EC103','1C'),(_binary 'DUfwàô™ª\Ã\›\Óˇ\0\"3',_binary 'ö{l]N?*ùéj[L=','EC103','1D'),(_binary 'Ufwàô™ª\Ã\›\Óˇ\0\"3D',_binary 'ö{l]N?*ùéj[L=','EC103','2A'),(_binary 'fwàô™ª\Ã\›\Óˇ\0\"3D\0',_binary 'ö{l]N?*ùéj[L=','EC103','2B'),(_binary 'wàô™ª\Ã\›\Óˇ\0\"3D\0\0',_binary 'ö{l]N?*ùéj[L=','EC103','2C'),(_binary 'àô™ª\Ã\›\Óˇ\0\"3D\0\0\0',_binary 'ö{l]N?*ùéj[L=','EC103','2D'),(_binary '\Ã\›\Óˇ\0\"3DUf\0\0\0\0\0',_binary 'ö{l]N?*ùéj[L=','FC103','1A'),(_binary '\›\Óˇ\0\"3DUfw\0\0\0\0\0',_binary 'ö{l]N?*ùéj[L=','FC103','1B'),(_binary 'Æ\0ªàô\0\"3DU\03ª',_binary '\Ùz¡X\ÃCr•g≤\√\‘y','AC202','LB01'),(_binary '≠\0™wàô\0\"3DU\0\"™',_binary '\Ùz¡X\ÃCr•g≤\√\‘y','AC302','LB01'),(_binary '´\0\ÓUfwàô\0\"3DU\0',_binary '\Ùz¡X\ÃCr•g≤\√\‘y','SL202','LB01'),(_binary '¨\0ˇfwàô\0\"3DU\0',_binary '\Ùz¡X\ÃCr•g≤\√\‘y','SL202','MB01');
/*!40000 ALTER TABLE `seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stations`
--

DROP TABLE IF EXISTS `stations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stations` (
  `stationId` binary(16) NOT NULL,
  `stationName` varchar(100) NOT NULL,
  `stationType` enum('railway','airport','bus','seaport') NOT NULL,
  `city` varchar(50) NOT NULL,
  `state` varchar(50) DEFAULT NULL,
  `country` varchar(50) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`stationId`),
  UNIQUE KEY `unique_station_name_type` (`stationName`,`stationType`,`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stations`
--

LOCK TABLES `stations` WRITE;
/*!40000 ALTER TABLE `stations` DISABLE KEYS */;
INSERT INTO `stations` VALUES (_binary '†±\¬\”\‰\ıj{åù\0\0\0\0\0','Kochi Airport','airport','Kochi','Kerala','India',10.15180000,76.39300000),(_binary '°≤\√\‘\Â\ˆzãú\r\0\0\0\0\0','Delhi Airport','airport','Delhi','Delhi','India',28.55620000,77.09990000),(_binary '°≤\√\‘\Â\ˆzãú\r/:K\\m','New Delhi Railway Station','railway','New Delhi','Delhi','India',28.64190000,77.21940000),(_binary '¢≥\ƒ\’\Ê\˜äõ\0\0\0\0\0','Mumbai Airport','airport','Mumbai','Maharashtra','India',19.08970000,72.86860000),(_binary '£¥\≈\÷\Á¯ö-\0\0\0\0\0','Bangalore Airport','airport','Bangalore','Karnataka','India',13.19890000,77.70680000),(_binary '£¥\≈\÷\Á¯ö->OZk|ç','Delhi Sarai Rohilla','railway','Delhi','Delhi','India',28.66390000,77.19940000),(_binary '§µ\∆\◊\Ë˘\n,=\0\0\0\0\0','Kolkata Airport','airport','Kolkata','West Bengal','India',22.65200000,88.44630000),(_binary '•∂\«\ÿ\È\\Z+<M\0\0\0\0\0','Chennai Airport','airport','Chennai','Tamil Nadu','India',12.99410000,80.17090000),(_binary '¶∑\»\Ÿ\‡\Ò*;L]\0\0\0\0\0','Hyderabad Airport','airport','Hyderabad','Telangana','India',17.24030000,78.42940000),(_binary 'ß∏\…\–\·\Ú:K\\m\0\0\0\0\0','Ahmedabad Airport','airport','Ahmedabad','Gujarat','India',23.02250000,72.57140000),(_binary 'ß∏\…\–\·\Ú:K\\m~èö-','Solapur Junction','railway','Solapur','Maharashtra','India',17.67180000,75.90950000),(_binary '®π¿\—\‚\ÛJ[l}\0\0\0\0\0','Jaipur Airport','airport','Jaipur','Rajasthan','India',26.82520000,75.80720000),(_binary '©∞¡\“\„\ÙZk|ç\0\0\0\0\0	','Lucknow Airport','airport','Lucknow','Uttar Pradesh','India',26.76060000,80.88930000),(_binary '±\¬\”\‰\ı¶{åù\0\0\0\0\0','Goa Airport','airport','Panaji','Goa','India',15.38030000,73.82890000),(_binary '≤\√\‘\Â\ˆßãú\r\0\0\0\0\0','Pune Airport','airport','Pune','Maharashtra','India',18.57930000,73.90890000),(_binary '≤\√\‘\Â\ˆßãú\r/:K\\m~','Kanpur Central','railway','Kanpur','Uttar Pradesh','India',26.44990000,80.33190000),(_binary '≥\ƒ\’\Ê\˜®õ.\0\0\0\0\0','Bhubaneswar Airport','airport','Bhubaneswar','Odisha','India',20.25050000,85.81560000),(_binary '¥\≈\÷\Á¯©->OZk|çû','Jaipur Junction','railway','Jaipur','Rajasthan','India',26.91240000,75.78730000),(_binary '∏\…\–\·\Ú£K\\m~èö->','Hyderabad Deccan','railway','Hyderabad','Telangana','India',17.38500000,78.48670000),(_binary '\√\‘\Â\ˆß∏ú\r/:K\\m~è','Patna Junction','railway','Patna','Bihar','India',25.60200000,85.13560000),(_binary '\≈\÷\Á¯©∞->OZk|çû','Ahmedabad Junction','railway','Ahmedabad','Gujarat','India',23.02650000,72.57140000),(_binary '\…\–\·\Ú£¥\\m~èö->O','Kolkata Station','railway','Kolkata','West Bengal','India',22.57260000,88.36390000),(_binary '\–\·\Ú£¥\≈m~èö->OZ','Bhubaneswar Station','railway','Bhubaneswar','Odisha','India',20.29610000,85.82450000),(_binary '\‘\Â\ˆß∏\…\r/:K\\m~èö','Howrah Junction','railway','Howrah','West Bengal','India',22.58400000,88.34330000),(_binary '\÷\Á¯©∞¡->OZk|çû\Z','Mumbai CSMT','railway','Mumbai','Maharashtra','India',18.93980000,72.83550000),(_binary '\·\Ú£¥\≈\÷~èö->OZk','Visakhapatnam Junction','railway','Visakhapatnam','Andhra Pradesh','India',17.73070000,83.30460000),(_binary '\Â\ˆß∏\…\–/:K\\m~èö','Mumbai Central','railway','Mumbai','Maharashtra','India',18.94320000,72.82120000),(_binary '\Ú£¥\≈\÷Áèö->OZk|','Chennai Central','railway','Chennai','Tamil Nadu','India',13.08270000,80.27070000),(_binary '\ˆß∏\…\–\·/:K\\m~èö','Pune Junction','railway','Pune','Maharashtra','India',18.52900000,73.84410000);
/*!40000 ALTER TABLE `stations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trains`
--

DROP TABLE IF EXISTS `trains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trains` (
  `vehicleId` binary(16) NOT NULL,
  `trainName` varchar(100) NOT NULL,
  PRIMARY KEY (`vehicleId`),
  CONSTRAINT `trains_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trains`
--

LOCK TABLES `trains` WRITE;
/*!40000 ALTER TABLE `trains` DISABLE KEYS */;
INSERT INTO `trains` VALUES (_binary '*Nlé\n,Noä.Ojå/','Garib Rath Express'),(_binary ';]ö=_zõ?[}ü=','Vande Bharat Express'),(_binary 'Lnä-Ojå-Ojå-O','Humsafar Express'),(_binary 'UÑ\0\‚õA‘ßDfUD\0\0','Rajdhani Express'),(_binary ']õ>_{ù>_{ù>_','Tejas Express'),(_binary 'nä-Ojå-Ojå-Oj','Jan Shatabdi Express'),(_binary 'õ>_zù>_zù>_z','Sampark Kranti Express'),(_binary 'ä-Ojã-Ojã-Ojã','Double Decker Express'),(_binary 'å;jE1´B\ıé]\Ÿ=\\>ü','Duronto Express'),(_binary '\Ùz¡X\ÃCr•g≤\√\‘y','Shatabdi Express');
/*!40000 ALTER TABLE `trains` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trips`
--

DROP TABLE IF EXISTS `trips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trips` (
  `tripId` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `name` varchar(100) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `status` enum('planning','booked','ongoing','completed','cancelled') DEFAULT 'planning',
  PRIMARY KEY (`tripId`),
  KEY `userId` (`userId`),
  CONSTRAINT `trips_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trips`
--

LOCK TABLES `trips` WRITE;
/*!40000 ALTER TABLE `trips` DISABLE KEYS */;
/*!40000 ALTER TABLE `trips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `useraddresses`
--

DROP TABLE IF EXISTS `useraddresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `useraddresses` (
  `addressId` binary(16) NOT NULL,
  `userId` binary(16) NOT NULL,
  `street` varchar(100) DEFAULT NULL,
  `city` varchar(50) NOT NULL,
  `state` varchar(50) DEFAULT NULL,
  `pinCode` varchar(10) DEFAULT NULL,
  `country` varchar(50) NOT NULL,
  PRIMARY KEY (`addressId`),
  KEY `userId` (`userId`),
  CONSTRAINT `useraddresses_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `useraddresses`
--

LOCK TABLES `useraddresses` WRITE;
/*!40000 ALTER TABLE `useraddresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `useraddresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `userId` binary(16) NOT NULL,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) DEFAULT NULL,
  `phoneNo` varchar(15) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(256) NOT NULL,
  `profilePicture` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (_binary '\ÊR\÷!=M¸®R3x\ÔAK≠','Aadish','Jain','+911111111111','jain.aadishj@gmail.com','$2b$10$FG4qkG/kjLz3a2Ku4SUIX.CeSPPZbwFMiS3p2LNA6/RVoFGw8Z3/6','https://lh3.googleusercontent.com/a/ACg8ocLZmAKL-V8reONsLjqGXdDO4LT3A6eG3hETXNXAui5313Aj2RPf=s96-c');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiclebookingitems`
--

DROP TABLE IF EXISTS `vehiclebookingitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiclebookingitems` (
  `vehicleItemId` binary(16) NOT NULL,
  `vehicleId` binary(16) NOT NULL,
  `onboardingLocation` varchar(100) NOT NULL,
  `deboardingLocation` varchar(100) NOT NULL,
  `onboardingTime` datetime NOT NULL,
  `deboardingTime` datetime NOT NULL,
  `coachType` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` enum('confirmed','pending','cancelled') DEFAULT 'pending',
  PRIMARY KEY (`vehicleItemId`),
  KEY `vehicleId` (`vehicleId`),
  CONSTRAINT `vehiclebookingitems_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiclebookingitems`
--

LOCK TABLES `vehiclebookingitems` WRITE;
/*!40000 ALTER TABLE `vehiclebookingitems` DISABLE KEYS */;
INSERT INTO `vehiclebookingitems` VALUES (_binary '31ÏÇ†\rJ+∑ºYùº˚\»:',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','New Delhi Railway Station','Howrah Junction','2025-04-18 02:00:00','2025-04-19 00:45:00','Sleeper',1250.00,'pending'),(_binary '4˙@&\·\Ì@B¶\Ê\≈n\‡ü\ﬂF',_binary 'éj[L=.\nõå}n_J;','Bangalore Airport','Kochi Airport','2025-04-23 03:15:00','2025-04-23 05:00:00','Business',8750.00,'pending');
/*!40000 ALTER TABLE `vehiclebookingitems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiclecoaches`
--

DROP TABLE IF EXISTS `vehiclecoaches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiclecoaches` (
  `coachId` varchar(5) NOT NULL,
  `vehicleId` binary(16) NOT NULL,
  `coachType` varchar(50) NOT NULL,
  `seatsAvailable` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`coachId`),
  UNIQUE KEY `unique_vehicle_coach` (`vehicleId`,`coachType`),
  CONSTRAINT `vehiclecoaches_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiclecoaches`
--

LOCK TABLES `vehiclecoaches` WRITE;
/*!40000 ALTER TABLE `vehiclecoaches` DISABLE KEYS */;
INSERT INTO `vehiclecoaches` VALUES ('AC101',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','AC 1st Class',48,4500.00),('AC201',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','AC 2 Tier',120,3200.00),('AC202',_binary '\Ùz¡X\ÃCr•g≤\√\‘y','AC 2 Tier',120,3000.00),('AC203',_binary 'å;jE1´B\ıé]\Ÿ=\\>ü','AC 2 Tier',130,3300.00),('AC204',_binary '*Nlé\n,Noä.Ojå/','AC 2 Tier',150,2700.00),('AC301',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','AC 3 Tier',240,2350.00),('AC302',_binary '\Ùz¡X\ÃCr•g≤\√\‘y','AC 3 Tier',240,2200.00),('AC303',_binary 'å;jE1´B\ıé]\Ÿ=\\>ü','AC 3 Tier',250,2450.00),('AC304',_binary '*Nlé\n,Noä.Ojå/','AC 3 Tier',280,1950.00),('BU101',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','Business',40,12500.00),('BU102',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','Business',25,9999.00),('BU103',_binary 'ö{l]N?*ùéj[L=','Business',30,13200.00),('BU104',_binary '.=L[jéù\n,=N_j{','Business',20,8500.00),('BU105',_binary '.=L[jéù\n,=N_j','Business',35,9200.00),('BU106',_binary 'éj[L=.\nõå}n_J;','Business',27,8750.00),('BU107',_binary '<M^ozãú\r/:K\\m~è','Business',32,11900.00),('BU108',_binary '\n,=N_j{åù*;L]','Business',30,12000.00),('BU109',_binary 'o~çú\Z/>M\\kzèû\r','Business',22,10500.00),('BU110',_binary 'KZl}éü\n,=N_j{åù','Business',26,9800.00),('CC101',_binary '\Ùz¡X\ÃCr•g≤\√\‘y','Chair Car',78,1800.00),('EC101',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','Economy',120,5999.00),('EC102',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','Economy',150,4599.00),('EC103',_binary 'ö{l]N?*ùéj[L=','Economy',130,6199.00),('EC104',_binary '.=L[jéù\n,=N_j{','Economy',140,3999.00),('EC105',_binary '.=L[jéù\n,=N_j','Economy',160,4299.00),('EC106',_binary 'éj[L=.\nõå}n_J;','Economy',110,3799.00),('EC107',_binary '<M^ozãú\r/:K\\m~è','Economy',125,5499.00),('EC108',_binary '\n,=N_j{åù*;L]','Economy',135,5799.00),('EC109',_binary 'o~çú\Z/>M\\kzèû\r','Economy',140,4899.00),('EC110',_binary 'KZl}éü\n,=N_j{åù','Economy',145,4199.00),('FC101',_binary '_ç:ú+AuπìMáß\Ò\Ë\“','First Class',10,22000.00),('FC103',_binary 'ö{l]N?*ùéj[L=','First Class',8,24500.00),('FC105',_binary '.=L[jéù\n,=N_j','First Class',15,19800.00),('FC107',_binary '<M^ozãú\r/:K\\m~è','First Class',12,21500.00),('FC109',_binary 'o~çú\Z/>M\\kzèû\r','First Class',10,23000.00),('SL201',_binary 'UÑ\0\‚õA‘ßDfUD\0\0','Sleeper',359,1250.00),('SL202',_binary '\Ùz¡X\ÃCr•g≤\√\‘y','Sleeper',320,1100.00),('SL203',_binary 'å;jE1´B\ıé]\Ÿ=\\>ü','Sleeper',340,1350.00),('SL204',_binary '*Nlé\n,Noä.Ojå/','Sleeper',380,950.00);
/*!40000 ALTER TABLE `vehiclecoaches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicledrivers`
--

DROP TABLE IF EXISTS `vehicledrivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicledrivers` (
  `driverId` binary(16) NOT NULL,
  `vehicleId` binary(16) NOT NULL,
  `driverName` varchar(100) NOT NULL,
  `driverPhoneNo` varchar(15) NOT NULL,
  PRIMARY KEY (`driverId`),
  KEY `vehicleId` (`vehicleId`),
  CONSTRAINT `vehicledrivers_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicledrivers`
--

LOCK TABLES `vehicledrivers` WRITE;
/*!40000 ALTER TABLE `vehicledrivers` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicledrivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `vehicleId` binary(16) NOT NULL,
  `vehicleType` enum('train','flight','bus','cab','cruise') NOT NULL,
  `status` enum('active','maintenance','cancelled') DEFAULT 'active',
  `availableSeats` int NOT NULL,
  PRIMARY KEY (`vehicleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
INSERT INTO `vehicles` VALUES (_binary '\n,=N_j{åù*;L]','flight','active',100),(_binary '.=L[jéù\n,=N_j','flight','active',100),(_binary '*Nlé\n,Noä.Ojå/','train','active',890),(_binary '.=L[jéù\n,=N_j{','flight','active',100),(_binary ';]ö=_zõ?[}ü=','train','active',950),(_binary '<M^ozãú\r/:K\\m~è','flight','active',100),(_binary 'KZl}éü\n,=N_j{åù','flight','active',100),(_binary 'Lnä-Ojå-Ojå-O','train','active',810),(_binary 'UÑ\0\‚õA‘ßDfUD\0\0','train','active',960),(_binary ']õ>_{ù>_{ù>_','train','active',880),(_binary '_ç:ú+AuπìMáß\Ò\Ë\“','flight','active',100),(_binary 'nä-Ojå-Ojå-Oj','train','active',780),(_binary 'o~çú\Z/>M\\kzèû\r','flight','active',100),(_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.','flight','active',100),(_binary 'õ>_zù>_zù>_z','train','active',920),(_binary 'ä-Ojã-Ojã-Ojã','train','active',850),(_binary 'å;jE1´B\ıé]\Ÿ=\\>ü','train','active',720),(_binary 'éj[L=.\nõå}n_J;','flight','active',100),(_binary 'ö{l]N?*ùéj[L=','flight','active',100),(_binary '\Ùz¡X\ÃCr•g≤\√\‘y','train','active',840);
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiclestations`
--

DROP TABLE IF EXISTS `vehiclestations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiclestations` (
  `vehicleStationId` binary(16) NOT NULL,
  `vehicleId` binary(16) NOT NULL,
  `stationId` binary(16) NOT NULL,
  `arrivalTime` datetime DEFAULT NULL,
  `departureTime` datetime DEFAULT NULL,
  `stoppage` int DEFAULT NULL,
  `stationOrder` int NOT NULL,
  PRIMARY KEY (`vehicleStationId`),
  UNIQUE KEY `unique_vehicle_station` (`vehicleId`,`stationId`),
  UNIQUE KEY `unique_vehicle_station_order` (`vehicleId`,`stationOrder`),
  KEY `stationId` (`stationId`),
  CONSTRAINT `vehiclestations_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`vehicleId`) ON DELETE CASCADE,
  CONSTRAINT `vehiclestations_ibfk_2` FOREIGN KEY (`stationId`) REFERENCES `stations` (`stationId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiclestations`
--

LOCK TABLES `vehiclestations` WRITE;
/*!40000 ALTER TABLE `vehiclestations` DISABLE KEYS */;
INSERT INTO `vehiclestations` VALUES (_binary '°°°°≤≤\√\√\‘\‘\Â\Â\Â\Â\Â',_binary '_ç:ú+AuπìMáß\Ò\Ë\“',_binary '°≤\√\‘\Â\ˆzãú\r\0\0\0\0\0',NULL,'2025-04-18 06:30:00',0,1),(_binary '¢¢¢¢≤≤\√\√\‘\‘\Â\Â\Â\Â\Â',_binary '_ç:ú+AuπìMáß\Ò\Ë\“',_binary '¢≥\ƒ\’\Ê\˜äõ\0\0\0\0\0','2025-04-18 08:45:00',NULL,0,2),(_binary '££££≤≤\√\√\‘\‘\Â\Â\Â\Â\Â',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.',_binary '£¥\≈\÷\Á¯ö-\0\0\0\0\0',NULL,'2025-04-19 10:15:00',0,1),(_binary '§§§§≤≤\√\√\‘\‘\Â\Â\Â\Â\Â',_binary '|4\Â\ˆ®\ŸK,ë\Á?\nmã\\.',_binary '§µ\∆\◊\Ë˘\n,=\0\0\0\0\0','2025-04-19 12:20:00',NULL,0,2),(_binary '••••≤≤\√\√\‘\‘\Â\Â\Â\Â\Â',_binary 'ö{l]N?*ùéj[L=',_binary '•∂\«\ÿ\È\\Z+<M\0\0\0\0\0',NULL,'2025-04-20 07:45:00',0,1),(_binary '¶¶¶¶≤≤\√\√\‘\‘\Â\Â\Â\Â\Â',_binary 'ö{l]N?*ùéj[L=',_binary '¶∑\»\Ÿ\‡\Ò*;L]\0\0\0\0\0','2025-04-20 08:50:00','2025-04-20 09:20:00',30,2),(_binary 'ßßßß≤≤\√\√\‘\‘\Â\Â\Â\Â\Â',_binary 'ö{l]N?*ùéj[L=',_binary '°≤\√\‘\Â\ˆzãú\r\0\0\0\0\0','2025-04-20 11:35:00',NULL,0,3),(_binary '®®®®≤≤\√\√\‘\‘\Â\Â\Â\Â\Â',_binary '.=L[jéù\n,=N_j{',_binary '¢≥\ƒ\’\Ê\˜äõ\0\0\0\0\0',NULL,'2025-04-21 14:30:00',0,1),(_binary '©©©©≤≤\√\√\‘\‘\Â\Â\Â\Â\Â	',_binary '.=L[jéù\n,=N_j{',_binary '°≤\√\‘\Â\ˆzãú\r\0\0\0\0\0','2025-04-21 16:45:00',NULL,0,2),(_binary '∞∞∞∞¡¡\“\“\„\„\Ù\Ù\Ù\Ù\Ù',_binary '.=L[jéù\n,=N_j',_binary 'ß∏\…\–\·\Ú:K\\m\0\0\0\0\0',NULL,'2025-04-22 05:15:00',0,1),(_binary '±±±±¡¡\“\“\„\„\Ù\Ù\Ù\Ù\Ù',_binary '.=L[jéù\n,=N_j',_binary '®π¿\—\‚\ÛJ[l}\0\0\0\0\0','2025-04-22 06:45:00','2025-04-22 07:15:00',30,2),(_binary '≤≤≤≤¡¡\“\“\„\„\Ù\Ù\Ù\Ù\Ù',_binary '.=L[jéù\n,=N_j',_binary '©∞¡\“\„\ÙZk|ç\0\0\0\0\0	','2025-04-22 08:45:00',NULL,0,3),(_binary '≥≥≥≥¡¡\“\“\„\„\Ù\Ù\Ù\Ù\Ù',_binary 'éj[L=.\nõå}n_J;',_binary '£¥\≈\÷\Á¯ö-\0\0\0\0\0',NULL,'2025-04-23 08:45:00',0,1),(_binary '¥¥¥¥¡¡\“\“\„\„\Ù\Ù\Ù\Ù\Ù',_binary 'éj[L=.\nõå}n_J;',_binary '†±\¬\”\‰\ıj{åù\0\0\0\0\0','2025-04-23 10:30:00',NULL,0,2),(_binary 'µµµµ¡¡\“\“\„\„\Ù\Ù\Ù\Ù\Ù',_binary '<M^ozãú\r/:K\\m~è',_binary '°≤\√\‘\Â\ˆzãú\r\0\0\0\0\0',NULL,'2025-04-24 11:20:00',0,1),(_binary '∂∂∂∂¡¡\“\“\„\„\Ù\Ù\Ù\Ù\Ù',_binary '<M^ozãú\r/:K\\m~è',_binary '±\¬\”\‰\ı¶{åù\0\0\0\0\0','2025-04-24 13:45:00',NULL,0,2),(_binary '∑∑∑∑¡¡\“\“\„\„\Ù\Ù\Ù\Ù\Ù',_binary '\n,=N_j{åù*;L]',_binary '¢≥\ƒ\’\Ê\˜äõ\0\0\0\0\0',NULL,'2025-04-25 16:00:00',0,1),(_binary '∏∏∏∏¡¡\“\“\„\„\Ù\Ù\Ù\Ù\Ù',_binary '\n,=N_j{åù*;L]',_binary '≤\√\‘\Â\ˆßãú\r\0\0\0\0\0','2025-04-25 17:15:00','2025-04-25 17:45:00',30,2),(_binary 'ππππ¡¡\“\“\„\„\Ù\Ù\Ù\Ù\Ù',_binary '\n,=N_j{åù*;L]',_binary '•∂\«\ÿ\È\\Z+<M\0\0\0\0\0','2025-04-25 19:50:00',NULL,0,3),(_binary '¿¿¿¿\—\—\‚\‚\ÛÛ§§§§§ ',_binary 'o~çú\Z/>M\\kzèû\r',_binary '§µ\∆\◊\Ë˘\n,=\0\0\0\0\0',NULL,'2025-04-26 09:15:00',0,1),(_binary '¡¡¡¡\—\—\‚\‚\ÛÛ§§§§§!',_binary 'o~çú\Z/>M\\kzèû\r',_binary '≥\ƒ\’\Ê\˜®õ.\0\0\0\0\0','2025-04-26 10:55:00','2025-04-26 11:25:00',30,2),(_binary '\¬\¬\¬\¬\—\—\‚\‚\ÛÛ§§§§§\"',_binary 'o~çú\Z/>M\\kzèû\r',_binary '•∂\«\ÿ\È\\Z+<M\0\0\0\0\0','2025-04-26 13:30:00',NULL,0,3),(_binary '\√\√\√\√\—\—\‚\‚\ÛÛ§§§§§#',_binary 'KZl}éü\n,=N_j{åù',_binary '¶∑\»\Ÿ\‡\Ò*;L]\0\0\0\0\0',NULL,'2025-04-27 13:20:00',0,1),(_binary '\ƒ\ƒ\ƒ\ƒ\—\—\‚\‚\ÛÛ§§§§§$',_binary 'KZl}éü\n,=N_j{åù',_binary '£¥\≈\÷\Á¯ö-\0\0\0\0\0','2025-04-27 14:45:00',NULL,0,2),(_binary '\\\\\‚\‚\”\”\ƒƒµµµµµ',_binary '*Nlé\n,Noä.Ojå/',_binary '\÷\Á¯©∞¡->OZk|çû\Z','2025-04-26 06:00:00',NULL,0,4),(_binary '\Ò\Ò\Ò\Ò\‚\‚\”\”\ƒƒµµµµµ',_binary 'UÑ\0\‚õA‘ßDfUD\0\0',_binary '°≤\√\‘\Â\ˆzãú\r/:K\\m',NULL,'2025-04-18 07:30:00',0,1),(_binary '\Ú\Ú\Ú\Ú\‚\‚\”\”\ƒƒµµµµµ',_binary 'UÑ\0\‚õA‘ßDfUD\0\0',_binary '≤\√\‘\Â\ˆßãú\r/:K\\m~','2025-04-18 12:45:00','2025-04-18 13:15:00',30,2),(_binary '\Û\Û\Û\Û\‚\‚\”\”\ƒƒµµµµµ',_binary 'UÑ\0\‚õA‘ßDfUD\0\0',_binary '\√\‘\Â\ˆß∏ú\r/:K\\m~è','2025-04-18 18:30:00','2025-04-18 19:00:00',30,3),(_binary '\Ù\Ù\Ù\Ù\‚\‚\”\”\ƒƒµµµµµ',_binary 'UÑ\0\‚õA‘ßDfUD\0\0',_binary '\‘\Â\ˆß∏\…\r/:K\\m~èö','2025-04-19 06:15:00',NULL,0,4),(_binary '\ı\ı\ı\ı\‚\‚\”\”\ƒƒµµµµµ',_binary '\Ùz¡X\ÃCr•g≤\√\‘y',_binary '\Â\ˆß∏\…\–/:K\\m~èö',NULL,'2025-04-20 06:00:00',0,1),(_binary '\ˆ\ˆ\ˆ\ˆ\‚\‚\”\”\ƒƒµµµµµ',_binary '\Ùz¡X\ÃCr•g≤\√\‘y',_binary '\ˆß∏\…\–\·/:K\\m~èö','2025-04-20 08:30:00','2025-04-20 08:45:00',15,2),(_binary '\˜\˜\˜\˜\‚\‚\”\”\ƒƒµµµµµ',_binary '\Ùz¡X\ÃCr•g≤\√\‘y',_binary 'ß∏\…\–\·\Ú:K\\m~èö-','2025-04-20 12:15:00','2025-04-20 12:30:00',15,3),(_binary '¯¯¯¯\‚\‚\”\”\ƒƒµµµµµ',_binary '\Ùz¡X\ÃCr•g≤\√\‘y',_binary '∏\…\–\·\Ú£K\\m~èö->','2025-04-20 18:00:00',NULL,0,4),(_binary '˘˘˘˘\‚\‚\”\”\ƒƒµµµµµ	',_binary 'å;jE1´B\ıé]\Ÿ=\\>ü',_binary '\…\–\·\Ú£¥\\m~èö->O',NULL,'2025-04-22 16:30:00',0,1),(_binary '˙˙˙˙\‚\‚\”\”\ƒƒµµµµµ',_binary 'å;jE1´B\ıé]\Ÿ=\\>ü',_binary '\–\·\Ú£¥\≈m~èö->OZ','2025-04-22 22:45:00','2025-04-22 23:00:00',15,2),(_binary '˚˚˚˚\‚\‚\”\”\ƒƒµµµµµ',_binary 'å;jE1´B\ıé]\Ÿ=\\>ü',_binary '\·\Ú£¥\≈\÷~èö->OZk','2025-04-23 05:30:00','2025-04-23 05:45:00',15,3),(_binary '¸¸¸¸\‚\‚\”\”\ƒƒµµµµµ',_binary 'å;jE1´B\ıé]\Ÿ=\\>ü',_binary '\Ú£¥\≈\÷Áèö->OZk|','2025-04-23 14:00:00',NULL,0,4),(_binary '˝˝˝˝\‚\‚\”\”\ƒƒµµµµµ',_binary '*Nlé\n,Noä.Ojå/',_binary '£¥\≈\÷\Á¯ö->OZk|ç',NULL,'2025-04-25 08:45:00',0,1),(_binary '˛˛˛˛\‚\‚\”\”\ƒƒµµµµµ',_binary '*Nlé\n,Noä.Ojå/',_binary '¥\≈\÷\Á¯©->OZk|çû','2025-04-25 13:30:00','2025-04-25 13:45:00',15,2),(_binary 'ˇˇˇˇ\‚\‚\”\”\ƒƒµµµµµ',_binary '*Nlé\n,Noä.Ojå/',_binary '\≈\÷\Á¯©∞->OZk|çû','2025-04-25 20:15:00','2025-04-25 20:30:00',15,3);
/*!40000 ALTER TABLE `vehiclestations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'karsafar_db'
--

--
-- Dumping routines for database 'karsafar_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-20 15:10:11
