/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Ce fichier C++ fait partie de la configuration par défaut utilisée par React Native.
// Il était initialement placé dans react-native pour encapsuler la config C++/CMake.
//
// Ici, il est copié dans le projet afin de permettre une personnalisation (ex. :
// fiabiliser les builds sous Windows, lier une librairie C++ manuellement,
// ou passer des flags de compilation).
//
// Pour personnaliser :
// 1) Placer `CMakeLists.txt` dans `android/app/src/main/jni`
// 2) Placer `OnLoad.cpp` dans le même dossier
// 3) Déclarer le chemin dans `android/app/build.gradle` :
//
// android {
//   externalNativeBuild {
//     cmake {
//       path "src/main/jni/CMakeLists.txt"
//     }
//   }
// }

#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <autolinking.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <rncore.h>

#ifdef REACT_NATIVE_APP_CODEGEN_HEADER
#include REACT_NATIVE_APP_CODEGEN_HEADER
#endif
#ifdef REACT_NATIVE_APP_COMPONENT_DESCRIPTORS_HEADER
#include REACT_NATIVE_APP_COMPONENT_DESCRIPTORS_HEADER
#endif

namespace facebook::react {

void registerComponents(
    std::shared_ptr<const ComponentDescriptorProviderRegistry> registry) {
  // Les composants Fabric personnalisés peuvent être enregistrés ici
  // (provenant de l'application ou de librairies tierces).
  //
  // providerRegistry->add(concreteComponentDescriptorProvider<MyComponentDescriptor>());

  // Composants locaux de l'app (si disponibles)
#ifdef REACT_NATIVE_APP_COMPONENT_REGISTRATION
  REACT_NATIVE_APP_COMPONENT_REGISTRATION(registry);
#endif

  // Sinon, on bascule sur les composants autolinkés
  autolinking_registerProviders(registry);
}

std::shared_ptr<TurboModule> cxxModuleProvider(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker) {
  // Permet de fournir des TurboModules C++ venant de l'application ou de librairies.
  // Exemple :
  // if (name == NativeCxxModuleExample::kModuleName) {
  //   return std::make_shared<NativeCxxModuleExample>(jsInvoker);
  // }

  // Sinon, on bascule sur les providers C++ autolinkés
  return autolinking_cxxModuleProvider(name, jsInvoker);
}

std::shared_ptr<TurboModule> javaModuleProvider(
    const std::string& name,
    const JavaTurboModule::InitParams& params) {
  // Permet de fournir un provider de TurboModules Java venant de l'application
  // ou de librairies. Exemple :
  // auto module = samplelibrary_ModuleProvider(name, params);
  // if (module != nullptr) return module;
  // return rncore_ModuleProvider(name, params);

  // Modules locaux de l'app (si disponibles)
#ifdef REACT_NATIVE_APP_MODULE_PROVIDER
  auto module = REACT_NATIVE_APP_MODULE_PROVIDER(name, params);
  if (module != nullptr) {
    return module;
  }
#endif

  // On essaie d'abord les modules coeur
  if (auto module = rncore_ModuleProvider(name, params)) {
    return module;
  }

  // Puis les providers autolinkés
  if (auto module = autolinking_ModuleProvider(name, params)) {
    return module;
  }

  return nullptr;
}

} // namespace facebook::react

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::DefaultTurboModuleManagerDelegate::cxxModuleProvider =
        &facebook::react::cxxModuleProvider;
    facebook::react::DefaultTurboModuleManagerDelegate::javaModuleProvider =
        &facebook::react::javaModuleProvider;
    facebook::react::DefaultComponentsRegistry::
        registerComponentDescriptorsFromEntryPoint =
            &facebook::react::registerComponents;
  });
}
