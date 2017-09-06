import React, { Component } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator
} from "react-native";

import Icon from "react-native-vector-icons/MaterialIcons";
import Interactable from "react-native-interactable";
import { Link } from "react-router-native";

import Text from "./text";
import Geolocate from "./geolocate";

import { colors } from "../styles";
import { baseStyles } from "../styles";

const Screen = {
  width: Dimensions.get("window").width,
  height: Dimensions.get("window").height - 75
};

class MapOverlay extends Component {
  constructor(props) {
    super(props);
    this._deltaY = new Animated.Value(Screen.height - 80);
    this.items = {};
  }

  setItemRef = key => {
    return view => {
      this.items[key] = view;
    };
  };

  open = () => {
    this._drawer.setVelocity({ y: -1000 });
    this.setState({
      drawerOpen: true
    });
  };

  close = () => {
    this._drawer.setVelocity({ y: 1000 });
    this.setState({
      drawerOpen: false
    });
  };

  toggle = () => {
    this.state.drawerOpen ? this.close() : this.open();
  };

  componentWillMount() {
    this.setState({
      drawerOpen: false
    });
  }

  renderNearbyPoints = () => {
    const {
      areaOfInterest,
      activeSurveys,
      features,
      observations,
      loading,
      querying,
      activeFeature
    } = this.props;

    features.forEach(feature => {
      feature.observations = observations.filter(
        obs => obs.tags["osm-p2p-id"] === feature.id
      );
      return feature;
    });

    if (!activeSurveys.length) {
      return (
        <View style={baseStyles.nearbyPoints}>
          <View style={[baseStyles.nearbyPointsHeader]}>
            <View
              style={[baseStyles.nearbyPointsDescription, { paddingTop: 10 }]}
            >
              <Link to="/account/surveys">
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start"
                  }}
                >
                  <Icon name="add" style={{ fontSize: 20 }} />
                  <Text style={[baseStyles.touchableLinks, { fontSize: 20 }]}>
                    Add a survey to get started
                  </Text>
                </View>
              </Link>
            </View>
          </View>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={baseStyles.nearbyPoints}>
          <View style={[baseStyles.nearbyPointsHeader]}>
            <View
              style={[
                baseStyles.nearbyPointsDescription,
                {
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  paddingTop: 10
                }
              ]}
            >
              <ActivityIndicator
                animating
                size="large"
                style={{ marginRight: 15 }}
              />
              <Text style={{ fontSize: 20 }}>Loading data</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={baseStyles.nearbyPoints}>
        <View style={[baseStyles.nearbyPointsHeader]}>
          <View
            style={[
              baseStyles.nearbyPointsDescription,
              { flexDirection: "row" }
            ]}
          >
            <TouchableOpacity onPress={this.toggle}>
              <Text style={[baseStyles.h4]}>
                {features.length.toLocaleString()} Nearby Points
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {this.props.userLocation
                  ? <Text>
                      Location: {this.props.userLocation.latitude.toFixed(2)},{" "}
                      {this.props.userLocation.longitude.toFixed(2)}
                    </Text>
                  : <Text>Geolocating...</Text>}
              </View>
            </TouchableOpacity>
            {querying &&
              <ActivityIndicator
                animating
                size="large"
                style={{ marginLeft: 30 }}
              />}
          </View>

          {/*
          // hide filter button temporarily
          <View style={{}}>
            <TouchableOpacity
              style={[baseStyles.buttonOutline]}
              onPress={this._onPressButton}
            >
              <Text>Filter</Text>
            </TouchableOpacity>
          </View>
          */}
        </View>

        <ScrollView
          horizontal={true}
          width={Screen.width}
          onScroll={e => {
            const xOffset = e.nativeEvent.contentOffset.x;
            let active;

            Object.keys(this.items).forEach((key, i) => {
              const item = this.items[key];
              const feature = features.find(f => f.id === key);

              item.measure((x, y, w, h, pX, pY) => {
                if (!active) {
                  active = { item, pX, feature };
                }

                // first item needs extra space
                const isFirstItem = i === 0 && pX >= -10;
                const isActive =
                  pX > 0 && (pX <= active.pX || active.pX < 0) && xOffset > 10;

                if (isFirstItem || isActive) {
                  active = { item, pX, feature };
                  activeFeature(feature);

                  item.setNativeProps({
                    style: {
                      borderColor: "#8212C6"
                    }
                  });
                } else {
                  item.setNativeProps({
                    style: {
                      borderColor: "#ccc"
                    }
                  });
                }
              });
            });
          }}
        >
          {features.map(item => {
            return (
              <View
                ref={this.setItemRef(item.id)}
                style={[baseStyles.cardStyle]}
                key={item.id}
              >
                <Link
                  to={{
                    pathname: `/feature/${item.id}`,
                    state: { feature: item }
                  }}
                >
                  <Text
                    style={[
                      baseStyles.h3,
                      baseStyles.headerWithDescription,
                      baseStyles.headerLink
                    ]}
                  >
                    {item.tags.name}
                  </Text>
                </Link>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {/* TODO: info about distance from user & related observations if applicable */}
                </View>
                <View
                  style={[
                    baseStyles.observationBlock,
                    { flexDirection: "row", flexWrap: "wrap" }
                  ]}
                >
                  <Text style={[baseStyles.metadataText]}>
                    {item.observations.length} Observations
                  </Text>
                  {/*<Text style={[baseStyles.textAlert]}>(2 incomplete)</Text>*/}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  render() {
    const { onGeolocate } = this.props;
    const closed = Screen.height - 45;
    const open = Screen.height - 210;

    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            right: 0,
            bottom: 270,
            width: 75,
            height: 140,
            transform: [
              {
                translateY: this._deltaY.interpolate({
                  inputRange: [open, closed],
                  outputRange: [1, 180]
                })
              }
            ]
          }}
        >
          <Geolocate onGeolocate={onGeolocate} />

          <Link
            to={{
              pathname: "/observation/choose-point",
              state: { addPoint: true }
            }}
            style={{
              width: 60,
              height: 60,
              borderRadius: 80,
              backgroundColor: "#8212C6",
              zIndex: 10,
              position: "absolute",
              right: 15,
              marginTop: 75
            }}
          >
            <Icon
              name="add"
              style={{
                paddingTop: 10,
                paddingLeft: 10,
                fontSize: 40,
                color: "#ffffff"
              }}
            />
          </Link>
        </Animated.View>

        <Interactable.View
          style={{
            height: 400
          }}
          verticalOnly={true}
          initialPosition={{ y: closed }}
          snapPoints={[{ y: open }, { y: closed }]}
          boundaries={{ top: open + 10 }}
          ref={view => {
            this._drawer = view;
          }}
          animatedValueY={this._deltaY}
        >
          {this.renderNearbyPoints()}
        </Interactable.View>
      </View>
    );
  }
}

export default MapOverlay;