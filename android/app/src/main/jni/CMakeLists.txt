# Ce fichier est basé sur le CMakeLists.txt par défaut de React Native
# et légèrement adapté pour une meilleure fiabilité sous Windows.
#
# Objectif : forcer l'utilisation de "fichiers de réponse" afin d'éviter les échecs
# CreateProcess sous Windows causés par des lignes de commande trop longues
# (CMake/Ninja + clang++).

cmake_minimum_required(VERSION 3.13)

# Les "fichiers de réponse" (surtout sous Windows) réduisent la longueur des commandes.
# Ces options doivent être définies AVANT `project()` pour être prises en compte.
set(CMAKE_NINJA_FORCE_RESPONSE_FILE ON)
set(CMAKE_C_USE_RESPONSE_FILE_FOR_INCLUDES ON)
set(CMAKE_CXX_USE_RESPONSE_FILE_FOR_INCLUDES ON)
set(CMAKE_C_USE_RESPONSE_FILE_FOR_OBJECTS ON)
set(CMAKE_CXX_USE_RESPONSE_FILE_FOR_OBJECTS ON)
set(CMAKE_C_USE_RESPONSE_FILE_FOR_LIBRARIES ON)
set(CMAKE_CXX_USE_RESPONSE_FILE_FOR_LIBRARIES ON)

# Limite la longueur des chemins d'objets pour rester sous les limites Windows courantes.
# Une valeur plus basse force CMake à utiliser des chemins d'objets plus courts
# (hashés) au lieu de reproduire la structure complète des dossiers.
set(CMAKE_OBJECT_PATH_MAX 128)

# Nom de la bibliothèque.
project(appmodules)

# Inclut tout le nécessaire pour construire l'application avec la New Architecture.
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)
