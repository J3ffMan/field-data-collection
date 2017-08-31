import { createSelector } from "reselect";

import { tilesForBounds, timeout } from "../lib";

export const selectAvailableSurveys = state => state.surveys.available;

export const selectCustomSurveys = createSelector(
  selectAvailableSurveys,
  surveys => surveys.filter(x => !x.default)
);

export const selectDefaultSurveys = createSelector(
  selectAvailableSurveys,
  surveys => surveys.filter(x => x.default)
);

export const selectActiveSurveys = createSelector(
  [selectCustomSurveys, selectDefaultSurveys],
  (customSurveys, defaultSurveys) =>
    customSurveys.length > 0 ? customSurveys : defaultSurveys
);

export const selectFeatureTypes = createSelector(selectActiveSurveys, surveys =>
  surveys
    .map(({ definition: { featureTypes } }) => featureTypes)
    .reduce((arr, val) => arr.concat(val), [])
);

export const selectFeatureType = (id, state) =>
  selectFeatureTypes(state).find(x => x.id === id);

export const selectIcons = createSelector(selectActiveSurveys, surveys =>
  surveys
    .map(x => x.icons)
    .filter(x => x != null)
    .reduce((arr, val) => arr.concat(val), [])
);

export const selectIcon = (id, state) =>
  // startsWith is used because Wao presets include size info
  selectIcons(state).find(x => x.icon.startsWith(id));

export const selectObservationTypes = createSelector(
  selectActiveSurveys,
  surveys =>
    surveys
      .map(({ definition: { featureTypes, observationTypes } }) =>
        observationTypes.map(t => featureTypes.find(x => x.id === t))
      )
      .reduce((arr, val) => arr.concat(val), [])
);

export const selectCategories = createSelector(
  [selectActiveSurveys, selectObservationTypes],
  (surveys, observationTypes) =>
    surveys
      .map(({ definition: { categories, name: surveyId } }) =>
        (categories || [])
          .reduce((arr, { icon, members, name }) => {
            const cat = arr.find(x => x.name === name);

            if (cat != null) {
              cat.members = cat.members.concat(
                members.filter(x => !cat.members.includes(x))
              );
            } else {
              arr.push({
                icon,
                members,
                name,
                surveyId
              });
            }

            return arr;
          }, [])
          .map(category => ({
            ...category,
            list: category.members
              .map(id => observationTypes.find(x => x.id === id))
              .map(({ id, name }) => ({ id, name }))
          }))
      )
      .reduce((arr, val) => arr.concat(val), [])
);

export const selectUncategorizedTypes = createSelector(
  [selectObservationTypes, selectCategories, selectActiveSurveys],
  (observationTypes, categories, surveys) => {
    // filter observationTypes to only include uncategorized types
    const filter = (observationTypes, categories) => {
      return observationTypes.filter(
        x =>
          !categories
            .map(x => {
              return x.members;
            })
            .reduce((arr, val) => arr.concat(val), [])
            .includes(x.id)
      );
    };

    // reduce to an array of objects
    const reduce = uncategorized => {
      var reducedObj = uncategorized.reduce((obj, x) => {
        if (!obj[x.surveyId]) {
          obj[x.surveyId] = {
            name: surveys.find(survey => {
              return (
                survey &&
                survey.definition &&
                survey.definition.id === x.surveyId
              );
            }),
            surveyId: x.surveyId,
            list: []
          };
        }

        obj[x.surveyId].list.push(x);
        return obj;
      }, {});

      return Object.keys(reducedObj).map(key => reducedObj[key]);
    };

    // return types categorized by survey if not categorized
    return reduce(filter(observationTypes, categories));
  }
);

export const selectAllCategories = createSelector(
  [selectCategories, selectUncategorizedTypes],
  (categories, uncategorized) => {
    return categories.concat(uncategorized);
  }
);

export const selectRemoteSurveys = state => state.surveys.remote;

export const selectStatus = state => state.status;

export const selectActiveObservation = state => state.observation;

export const selectUserObservations = state => {};

export const selectSelectedFeatures = state => state.features.selected || [];

export const selectSelectedObservations = state =>
  state.observations.selected || [];

export const selectVisibleBounds = state => state.bounds.visible;

export const selectFeatures = state => state.features.features;

export const selectObservations = state => state.observations.observations;

export const selectVisibleFeatures = createSelector(
  [selectVisibleBounds, selectFeatures],
  (visibleBounds, features) => {
    const tiles = tilesForBounds(visibleBounds);

    return tiles
      .reduce((visibleFeatures, tile) => {
        visibleFeatures = visibleFeatures.concat(
          features[tile.join("/")] || []
        );

        return visibleFeatures;
      }, [])
      .filter(
        ({ lat, lon }) =>
          // check for containment
          visibleBounds[0] <= lon &&
          lon <= visibleBounds[2] &&
          visibleBounds[1] <= lat &&
          lat <= visibleBounds[3]
      );
  }
);

export const selectVisibleObservations = createSelector(
  [selectVisibleBounds, selectObservations],
  (visibleBounds, observations) => {
    const tiles = tilesForBounds(visibleBounds);

    return tiles
      .reduce((visibleObservations, tile) => {
        visibleObservations = visibleObservations.concat(
          observations[tile.join("/")] || []
        );

        return visibleObservations;
      }, [])
      .filter(
        ({ lat, lon }) =>
          // check for containment
          visibleBounds[0] <= lon &&
          lon <= visibleBounds[2] &&
          visibleBounds[1] <= lat &&
          lat <= visibleBounds[3]
      );
  }
);

export const selectLoadingStatus = state => state.features.loading;

export const selectActiveFeatureTileQueries = state =>
  state.features.activeTileQueries;

export const selectActiveObservationTileQueries = state =>
  state.observations.activeTileQueries;
